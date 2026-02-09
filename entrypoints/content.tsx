import dayjs from 'dayjs'
import { EXPORT_TYPE, FILE_DATE_FORMAT } from './popup/config'
import { IMemoResult, IMessage } from './popup/types'
import { globalLoading, memoListFilter } from './popup/utils/exportHelper'
import { handleExportFile } from './popup/utils/exportFile'
import { contentParse } from './popup/utils/parse'
import { useState } from 'react'
import Loading from './popup/components/Loading'
import { createRoot } from 'react-dom/client'
import { ExportTypeEnum } from './popup/const/exportConst'

export default defineContentScript({
  matches: ['*://*.okjike.com/*'],
  cssInjectionMode: 'ui',
  main(ctx) {
    browser.runtime.onMessage.addListener(async function (message: IMessage) {
      const { type, config, isVerified, openInNewTab, topicMaxItems } = message
      const { startDate: startDateStr, endDate: endDateStr, fileType } = config

      // 接收后将 ISO 字符串转换回 Dayjs 对象
      const startDate = startDateStr ? dayjs(startDateStr) : null
      const endDate = endDateStr ? dayjs(endDateStr) : null

      const modifyConfig = {
        ...config,
        // 如果是在新标签页中打开，默认使用 markdown
        fileType: openInNewTab ? ExportTypeEnum.MD : fileType,
        // 使用转换后的 Dayjs 对象
        startDate,
        endDate,
      }

      if (type !== EXPORT_TYPE) return

      const isUserPage =
        window.location.href.startsWith('https://web.okjike.com/u') &&
        !window.location.pathname.includes('/post/')
      const isTopicPage = getIsTopicPage()

      if (!isUserPage && !isTopicPage) {
        alert('请进入一个用户的动态列表或圈子广场页面操作')
        return
      }

      // 获取带有更新提示功能的loading组件
      const { openLoading, closeLoading, updateLoadingTip } =
        createDynamicLoading(ctx)

      openLoading('正在准备导出数据...')

      // 根据页面类型提取不同的 ID
      const urlParts = window.location.pathname.split('/')
      const username = isTopicPage ? '' : urlParts[urlParts.length - 1]
      const topicId = isTopicPage ? getTopicIdFromUrl() : ''

      try {
        // 从localStorage获取token
        const accessToken = localStorage.getItem('JK_ACCESS_TOKEN')

        if (!accessToken) {
          throw new Error('未找到访问令牌，请确保已登录即刻网站')
        }

        // 获取所有数据（包括分页），传入startDate参数、更新提示的函数和isVerified状态
        const allData = await fetchAllJikeData(
          username,
          accessToken,
          20,
          startDate,
          updateLoadingTip,
          isVerified,
          topicId,
          topicMaxItems
        )

        if (allData && allData.length > 0) {
          updateLoadingTip(`已获取 ${allData.length} 条数据，正在处理...`)

          // 将API数据转换为memoResultList格式
          const memoResultList = convertApiDataToMemoFormat({ data: allData })

          // 数据二次处理
          const filteredMemoList = memoListFilter(
            memoResultList,
            isVerified,
            modifyConfig
          )
          const newMemoList = contentParse(filteredMemoList, modifyConfig)

          // 获取作者信息(结果拼接 动态 / 收藏)
          let authorInfo: string
          if (isTopicPage) {
            const topicName = allData[0]?.topic?.content || '圈子'
            authorInfo = `${topicName}的广场`
          } else {
            const author =
              allData[0].user.screenName ||
              (await fetchUserProfile(accessToken))
            authorInfo = getIsCollectionPage()
              ? `${author}的收藏`
              : `${author}的动态`
          }

          if (openInNewTab) {
            updateLoadingTip(`正在准备新页面预览...`)
            await openDataInNewTab(newMemoList, authorInfo)
          } else {
            updateLoadingTip(`正在生成导出文件...`)
            // 下载笔记
            handleExportFile(newMemoList, authorInfo, modifyConfig)
          }
        } else {
          console.error('Failed to fetch data: No data returned')
          alert('获取数据失败，请重试')
        }
      } catch (error) {
        console.error('Error during data fetch:', error)
        alert(
          '获取数据时出错: ' +
            (error instanceof Error ? error.message : String(error))
        )
      } finally {
        closeLoading()
      }
    })
  },
})

// 创建可以动态更新提示的loading组件
function createDynamicLoading(ctx: any) {
  let tipUpdateCallback: ((tip: string) => void) | null = null

  const app = createIntegratedUi(ctx, {
    position: 'inline',
    onMount: (container) => {
      const app = document.createElement('div')
      container.append(app)
      const root = createRoot(app)

      // 创建一个可以更新提示的组件
      const DynamicLoading = () => {
        const [tip, setTip] = useState('正在加载...')

        // 保存更新函数的引用，以便外部调用
        tipUpdateCallback = setTip

        return <Loading tip={tip} />
      }

      root.render(<DynamicLoading />)
      return root
    },
  })

  function openLoading(initialTip: string = '正在加载...') {
    app.mount()
    const loadingEl = app.wrapper
    loadingEl.style.display = 'flex'
    loadingEl.style.alignItems = 'center'
    loadingEl.style.justifyContent = 'center'
    loadingEl.style.position = 'fixed'
    loadingEl.style.inset = '0'
    loadingEl.style.width = '100%'
    loadingEl.style.height = '100%'
    loadingEl.style.zIndex = '9999'
    loadingEl.style.backgroundColor = 'rgb(0 0 0 / 50%)'

    // 设置初始提示
    if (tipUpdateCallback) {
      tipUpdateCallback(initialTip)
    }
  }

  function closeLoading() {
    if (app) {
      app.remove()
    }
  }

  function updateLoadingTip(tip: string) {
    if (tipUpdateCallback) {
      tipUpdateCallback(tip)
    }
  }

  return {
    openLoading,
    closeLoading,
    updateLoadingTip,
  }
}

// 修改fetchAllJikeData函数，接收isVerified参数
async function fetchAllJikeData(
  username: string,
  accessToken: string,
  limit = 20,
  startDate?: dayjs.Dayjs | null,
  updateTip?: (tip: string) => void,
  isVerified: boolean = true, // 添加isVerified参数，默认为true
  topicId?: string,
  topicMaxItems?: number
): Promise<any[]> {
  let allItems: any[] = []
  let loadMoreKey: any = null
  let hasMore = true
  let pageCount = 0

  const isTopicMode = !!topicId

  // 圈子模式使用 topicMaxItems（默认200，最大1000），用户模式未验证限制60条
  const MAX_ITEMS = isTopicMode
    ? Math.min(topicMaxItems || 200, 1000)
    : !isVerified
      ? 60
      : Infinity

  // 未验证用户的最大条数限制
  const UNVERIFIED_MAX_ITEMS = 60

  // 如果有startDate，转换为时间戳用于比较
  const startDateTime = startDate ? startDate.valueOf() : null

  // 更新初始加载提示
  updateTip?.(`正在获取数据，第 ${pageCount} 页...`)

  while (hasMore) {
    pageCount++

    // 如果已达到条数限制，则停止获取更多数据
    if (allItems.length >= MAX_ITEMS) {
      if (isTopicMode) {
        console.log(
          `Topic mode reached item limit (${MAX_ITEMS}), stopping pagination`
        )
        updateTip?.(
          `圈子最多获取 ${MAX_ITEMS} 条数据，已获取 ${allItems.length} 条...`
        )
      } else {
        console.log(
          `Unverified user reached item limit (${UNVERIFIED_MAX_ITEMS}), stopping pagination`
        )
        updateTip?.(
          `未验证用户最多获取 ${UNVERIFIED_MAX_ITEMS} 条数据，已获取 ${allItems.length} 条...`
        )
      }
      break
    }

    // 更新加载提示
    updateTip?.(
      `正在获取数据，第 ${pageCount} 页，已获取 ${allItems.length} 条...${
        MAX_ITEMS !== Infinity ? `（最多获取 ${MAX_ITEMS} 条）` : ''
      }`
    )

    try {
      // 获取当前页数据
      const response = await fetchJikeData(
        username,
        accessToken,
        limit,
        loadMoreKey,
        topicId
      )

      // 检查响应是否有效
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.error('Invalid API response:', response)
        hasMore = false
        continue
      }

      // 检查是否所有数据都早于startDate（只有这种情况才停止获取）
      let allItemsBeforeStartDate = false

      if (startDateTime) {
        // 检查这一页是否所有数据都比 startDate 早
        allItemsBeforeStartDate = response.data.every((item: any) => {
          const itemDate = new Date(item.actionTime || item.createdAt).getTime()
          return itemDate < startDateTime
        })

        if (allItemsBeforeStartDate) {
          console.log(`Page ${pageCount}: 所有数据都早于 startDate，停止获取`)
        }
      }

      // 过滤出在日期范围内的数据（如果设置了 startDate）
      const itemsToProcess = startDateTime
        ? response.data.filter((item: any) => {
            const itemDate = new Date(
              item.actionTime || item.createdAt
            ).getTime()
            return itemDate >= startDateTime
          })
        : response.data

      if (startDateTime) {
        console.log(
          `Page ${pageCount}: 过滤掉 ${
            response.data.length - itemsToProcess.length
          } 条早于 startDate 的数据，保留 ${itemsToProcess.length} 条`
        )
      }

      // 限制添加的数据量（圈子模式或未验证用户）
      if (
        MAX_ITEMS !== Infinity &&
        allItems.length + itemsToProcess.length > MAX_ITEMS
      ) {
        const itemsToAdd = itemsToProcess.slice(
          0,
          MAX_ITEMS - allItems.length
        )
        allItems = allItems.concat(itemsToAdd)
        console.log(
          `Limited to ${MAX_ITEMS} items`
        )
        hasMore = false
      } else {
        allItems = allItems.concat(itemsToProcess)
      }

      // 更新加载提示
      const limitMessage =
        MAX_ITEMS !== Infinity ? `（最多获取 ${MAX_ITEMS} 条）` : ''
      updateTip?.(
        `正在获取数据，第 ${pageCount} 页，已获取 ${allItems.length} 条...${limitMessage}`
      )

      // 如果已达到条数限制，停止获取更多数据
      if (MAX_ITEMS !== Infinity && allItems.length >= MAX_ITEMS) {
        console.log(
          `Reached item limit (${MAX_ITEMS}), stopping pagination`
        )
        hasMore = false
        continue
      }

      // 如果所有数据都早于 startDate，说明后面的数据也都更早，停止获取
      if (allItemsBeforeStartDate) {
        console.log(`All items before start date, stopping pagination`)
        hasMore = false
        continue
      }

      // 更新加载更多的key
      if (response.loadMoreKey) {
        loadMoreKey = response.loadMoreKey
        console.log(
          `Fetched page ${pageCount}, items so far: ${allItems.length}, loadMoreKey:`,
          loadMoreKey
        )
      } else {
        hasMore = false
        console.log(
          `Fetched page ${pageCount}, items so far: ${allItems.length}, no more pages`
        )

        // 更新提示，告知用户已获取所有数据
        updateTip?.(`已获取所有数据，共 ${allItems.length} 条...`)
      }

      // 可选：添加延迟以避免请求过于频繁
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error(`Error fetching page ${pageCount}:`, error)
      hasMore = false

      // 更新提示，告知用户获取数据出错
      updateTip?.(
        `获取第 ${pageCount} 页数据时出错，已获取 ${allItems.length} 条...`
      )
    }
  }

  console.log(
    `Fetched a total of ${allItems.length} items from ${pageCount} pages`
  )

  // 最终更新提示
  const limitMessage =
    MAX_ITEMS !== Infinity && allItems.length >= MAX_ITEMS
      ? `（限制为 ${MAX_ITEMS} 条）`
      : ''
  updateTip?.(
    `数据获取完成，共 ${pageCount} 页，${allItems.length} 条数据 ${limitMessage}`
  )

  return allItems
}

// 获取即刻数据的单页函数
async function fetchJikeData(
  username: string,
  accessToken: string,
  limit = 20,
  loadMoreKey: any = null,
  topicId?: string
) {
  const isTopicMode = !!topicId

  const url = isTopicMode
    ? 'https://api.ruguoapp.com/1.0/topics/tabs/square/feed'
    : getIsCollectionPage()
      ? 'https://api.ruguoapp.com/1.0/collections/list'
      : 'https://api.ruguoapp.com/1.0/personalUpdate/single'

  const headers = {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    origin: 'https://web.okjike.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    'x-jike-access-token': accessToken,
  }

  // 构建请求体，根据页面类型添加相应参数
  const requestBody: any = {
    limit: limit,
  }

  if (isTopicMode) {
    requestBody.topicId = topicId
  } else {
    requestBody.username = username
  }

  // 如果有loadMoreKey，添加到请求体
  if (loadMoreKey) {
    requestBody.loadMoreKey = loadMoreKey
  }

  const body = JSON.stringify(requestBody)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

// 将API返回的数据转换为memoResultList格式
function convertApiDataToMemoFormat(apiData: any): IMemoResult[] {
  if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
    return []
  }

  return apiData.data.map((item: any) => {
    // 提取时间
    const time = dayjs(item.actionTime || item.createdAt).format(
      FILE_DATE_FORMAT
    )

    // 提取内容 - 原始内容可能是纯文本，不需要转换
    let originalContent = item.content || ''

    // 转换为Markdown和纯文本格式 - 不再在这里添加转发内容
    let content = originalContent
    let rawContent = originalContent

    // 提取链接信息
    const contentCircle = item.linkInfo
      ? {
          title: item.linkInfo.title || '',
          url: item.linkInfo.linkUrl || '',
        }
      : null

    // 提取图片
    let files: string[] = []

    // 处理当前动态的图片
    if (item.pictures && Array.isArray(item.pictures)) {
      files = files.concat(
        item.pictures.map(
          (pic: any) => pic.picUrl || pic.middlePicUrl || pic.smallPicUrl || ''
        )
      )
    }

    // 处理转发动态中的图片 - 保留这部分，确保转发内容的图片也被包含
    if (
      item.type === 'REPOST' &&
      item.target &&
      item.target.pictures &&
      Array.isArray(item.target.pictures)
    ) {
      files = files.concat(
        item.target.pictures.map(
          (pic: any) => pic.picUrl || pic.middlePicUrl || pic.smallPicUrl || ''
        )
      )
    }

    // 提取动态链接
    const memoLink = `https://web.okjike.com/originalPost/${item.id}`

    // 提取圈子信息
    const memoCircle = item.topic
      ? {
          title: item.topic.content || '',
          url: `https://web.okjike.com/topic/${item.topic.id}`,
        }
      : null

    // 处理引用内容 - 保留这部分，让markdownParse处理格式化
    let quote = ''
    let quoteCircle = null

    // 如果是转发，将target内容作为引用
    if (item.type === 'REPOST' && item.target) {
      // 获取转发的原始内容
      const targetUser = item.target.user
        ? item.target.user.screenName
        : '未知用户'
      quote = `**@${targetUser}：**\n${item.target.content || ''}`

      if (item.target.topic) {
        quoteCircle = {
          title: item.target.topic.content || '',
          url: `https://web.okjike.com/topic/${item.target.topic.id}`,
        }
      }
    }

    return {
      time,
      rawContent,
      content,
      contentCircle,
      quote,
      quoteCircle,
      memoLink,
      memoCircle,
      files: files.filter((url) => url), // 过滤空URL
    }
  })
}

// 新增获取用户信息的函数
async function fetchUserProfile(accessToken: string): Promise<string> {
  const url = 'https://api.ruguoapp.com/1.0/users/profile'

  const headers = {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    origin: 'https://web.okjike.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    'x-jike-access-token': accessToken,
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    if (!data.user?.screenName) {
      throw new Error('Failed to get user screenName from profile')
    }

    return data.user.screenName
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

function getIsTopicPage() {
  return window.location.pathname.startsWith('/topic/')
}

function getTopicIdFromUrl(): string {
  const parts = window.location.pathname.split('/')
  return parts[2] // index 0='', 1='topic', 2='{topicId}'
}

function getIsCollectionPage() {
  return window.location.pathname.endsWith('/collection')
}

// 添加新函数用于在新标签页中打开数据
async function openDataInNewTab(
  newMemoList: IMemoResult[],
  authorInfo: string
) {
  // 将数据存储到 storage 中以便新标签页访问
  await browser.storage.local.set({
    previewData: {
      memoList: newMemoList,
      authorInfo: authorInfo,
      timestamp: Date.now(), // 添加时间戳以便清理旧数据
    },
  })

  // 打开新标签页
  await browser.runtime.sendMessage({
    action: 'openPreviewTab',
    url: browser.runtime.getURL('/preview.html'),
  })
}
