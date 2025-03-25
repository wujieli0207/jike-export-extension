import dayjs from 'dayjs'
import { EXPORT_TYPE, FILE_DATE_FORMAT } from './popup/config'
import { IMemoResult, IMessage } from './popup/types'
import { globalLoading, memoListFilter } from './popup/utils/exportHelper'
import { handleExportFile } from './popup/utils/exportFile'
import { contentParse } from './popup/utils/parse'
import { useState } from 'react'
import Loading from './popup/components/Loading'
import { createRoot } from 'react-dom/client'

export default defineContentScript({
  matches: ['*://*.okjike.com/*'],
  cssInjectionMode: 'ui',
  main(ctx) {
    browser.runtime.onMessage.addListener(async function (message: IMessage) {
      const { type, config, isVerified } = message
      const { startDate } = config

      if (type !== EXPORT_TYPE) return

      if (
        !window.location.href.startsWith('https://web.okjike.com/u') ||
        window.location.pathname.includes('/post/')
      ) {
        alert('请进入一个用户的动态列表操作')
        return
      }

      // 获取带有更新提示功能的loading组件
      const { openLoading, closeLoading, updateLoadingTip } =
        createDynamicLoading(ctx)

      openLoading('正在准备导出数据...')

      // 从URL中提取用户名(id)
      const urlParts = window.location.pathname.split('/')
      const username = urlParts[urlParts.length - 1]

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
          isVerified
        )

        if (allData && allData.length > 0) {
          updateLoadingTip(`已获取 ${allData.length} 条数据，正在处理...`)

          // 将API数据转换为memoResultList格式
          const memoResultList = convertApiDataToMemoFormat({ data: allData })

          // 数据二次处理
          const filteredMemoList = memoListFilter(
            memoResultList,
            isVerified,
            config
          )
          const newMemoList = contentParse(filteredMemoList, config)

          // 获取作者信息(结果拼接 动态 / 收藏)
          const author = await fetchUserProfile(accessToken)
          const authorInfo = getIsCollectionPage()
            ? `${author}的收藏`
            : `${author}的动态`

          updateLoadingTip(`正在生成导出文件...`)
          // 下载笔记
          handleExportFile(newMemoList, authorInfo, config)
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
  isVerified: boolean = true // 添加isVerified参数，默认为true
): Promise<any[]> {
  let allItems: any[] = []
  let loadMoreKey: any = null
  let hasMore = true
  let pageCount = 0

  // 未验证用户的最大条数限制
  const UNVERIFIED_MAX_ITEMS = 60

  // 如果有startDate，转换为Date对象用于比较
  // @ts-ignore
  const startDateTime = startDate ? new Date(startDate).getTime() : null

  // 更新初始加载提示
  updateTip?.(`正在获取数据，第 ${pageCount} 页...`)

  while (hasMore) {
    pageCount++

    // 如果用户未验证且已达到条数限制，则停止获取更多数据
    if (!isVerified && allItems.length >= UNVERIFIED_MAX_ITEMS) {
      console.log(
        `Unverified user reached item limit (${UNVERIFIED_MAX_ITEMS}), stopping pagination`
      )
      updateTip?.(
        `未验证用户最多获取 ${UNVERIFIED_MAX_ITEMS} 条数据，已获取 ${allItems.length} 条...`
      )
      break
    }

    // 更新加载提示
    updateTip?.(
      `正在获取数据，第 ${pageCount} 页，已获取 ${allItems.length} 条...${
        !isVerified ? `（未验证用户最多获取 ${UNVERIFIED_MAX_ITEMS} 条）` : ''
      }`
    )

    try {
      // 获取当前页数据
      const response = await fetchJikeData(
        username,
        accessToken,
        limit,
        loadMoreKey
      )

      // 检查响应是否有效
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.error('Invalid API response:', response)
        hasMore = false
        continue
      }

      // 检查是否有数据早于startDate
      let reachedStartDate = false
      if (startDateTime) {
        for (const item of response.data) {
          const itemDate = new Date(item.actionTime || item.createdAt).getTime()
          if (itemDate < startDateTime) {
            console.log(
              `Found item older than start date: ${new Date(
                itemDate
              ).toISOString()}`
            )
            reachedStartDate = true
            break
          }
        }
      }

      // 如果找到早于startDate的数据，只添加符合日期条件的数据
      if (startDateTime && reachedStartDate) {
        const filteredItems = response.data.filter((item: any) => {
          const itemDate = new Date(item.actionTime || item.createdAt).getTime()
          return itemDate >= startDateTime
        })

        console.log(
          `Filtered ${
            response.data.length - filteredItems.length
          } items older than start date`
        )

        // 对于未验证用户，限制添加的数据量
        if (
          !isVerified &&
          allItems.length + filteredItems.length > UNVERIFIED_MAX_ITEMS
        ) {
          const itemsToAdd = filteredItems.slice(
            0,
            UNVERIFIED_MAX_ITEMS - allItems.length
          )
          allItems = allItems.concat(itemsToAdd)
          console.log(
            `Limited to ${UNVERIFIED_MAX_ITEMS} items for unverified user`
          )
        } else {
          allItems = allItems.concat(filteredItems)
        }

        hasMore = false // 停止获取更多页

        // 更新提示，告知用户已达到开始日期
        updateTip?.(`已达到开始日期，共获取 ${allItems.length} 条数据...`)
      } else {
        // 对于未验证用户，限制添加的数据量
        if (
          !isVerified &&
          allItems.length + response.data.length > UNVERIFIED_MAX_ITEMS
        ) {
          const itemsToAdd = response.data.slice(
            0,
            UNVERIFIED_MAX_ITEMS - allItems.length
          )
          allItems = allItems.concat(itemsToAdd)
          console.log(
            `Limited to ${UNVERIFIED_MAX_ITEMS} items for unverified user`
          )
          hasMore = false // 已达到限制，停止获取更多页
        } else {
          // 添加当前页的所有数据到结果数组
          allItems = allItems.concat(response.data)
        }

        // 更新加载提示，显示当前获取的数据量
        const limitMessage = !isVerified
          ? `（未验证用户最多获取 ${UNVERIFIED_MAX_ITEMS} 条）`
          : ''
        updateTip?.(
          `正在获取数据，第 ${pageCount} 页，已获取 ${allItems.length} 条...${limitMessage}`
        )
      }

      // 如果未验证用户已达到条数限制，停止获取更多数据
      if (!isVerified && allItems.length >= UNVERIFIED_MAX_ITEMS) {
        console.log(
          `Unverified user reached item limit (${UNVERIFIED_MAX_ITEMS}), stopping pagination`
        )
        hasMore = false
        continue
      }

      // 如果已经到达开始日期，不再继续获取数据
      if (reachedStartDate) {
        console.log(`Reached start date, stopping pagination`)
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
    !isVerified && allItems.length >= UNVERIFIED_MAX_ITEMS
      ? `（未验证用户限制为 ${UNVERIFIED_MAX_ITEMS} 条）`
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
  loadMoreKey: any = null
) {
  const url = getIsCollectionPage()
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

  // 构建请求体，根据是否有loadMoreKey添加相应参数
  const requestBody: any = {
    limit: limit,
    username: username,
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

function getIsCollectionPage() {
  return window.location.pathname.endsWith('/collection')
}
