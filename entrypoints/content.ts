import html2md from 'html-to-md'
import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import dayjs from 'dayjs'
import { EXPORT_TYPE } from './popup/config'
import { IMemoResult, IMessage } from './popup/types'

const FILE_DATE_FORMAT = 'YYYY-MM-DD_HH-mm-ss'
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const MEMOS_SELECTOR = '#react-tabs-1 > div > div'

export default defineContentScript({
  matches: ['*://*.okjike.com/*'],
  cssInjectionMode: 'ui',
  main(ctx) {
    browser.runtime.onMessage.addListener(async function (message: IMessage) {
      if (message.type !== EXPORT_TYPE) return

      const isVerified = message.isVerified

      const initMemos = document.querySelector(
        MEMOS_SELECTOR
      ) as HTMLDivElement | null

      if (!initMemos) {
        alert('请进入一个用户的动态列表操作')
        return
      }

      // 等待滚动，获取全部数据
      await autoScroll(isVerified)

      const totalMemos = document.querySelector(
        MEMOS_SELECTOR
      ) as HTMLDivElement | null
      if (!totalMemos) return

      const author = getAuthor()
      const memoList = await getMemos(totalMemos)

      // 数据二次处理
      // 未激活场景只取前 50 条
      const newMemoList = (isVerified ? memoList : memoList.slice(0, 50)).map(
        (memo) => {
          let content = memo.content

          // 内容的附带的链接
          if (memo.contentCircle) {
            content += `\n\n[${memo.contentCircle.title}](${memo.contentCircle.url})`
          }

          // 动态链接
          if (memo.memoLink) {
            content += `\n\n[原动态链接](${memo.memoLink})`
          }

          // 所属圈子
          if (memo.memoCircle) {
            content += `\n\n圈子: [${memo.memoCircle.title}](${memo.memoCircle.url})`
          }

          // 引用动态
          if (memo.quote) {
            content += `\n\n---\n\n> 引用动态：\n\n${memo.quote}`
          }
          // 引用动态的圈子
          if (memo.quoteCircle) {
            content += `\n\n引用动态圈子: [${memo.quoteCircle.title}](${memo.quoteCircle.url})`
          }

          // 文件链接至 momo 中
          if (memo.files.length > 0) {
            content += `\n${memo.files
              .map((_item, i) => `\n![image](images/${memo.time}_${i + 1}.png)`)
              .join('\n')}`
          }

          return {
            ...memo,
            content,
          }
        }
      )

      // 下载笔记
      message.config.isSingleFile
        ? handleExportAsSingleFile(newMemoList, author)
        : handleExportAsMultiFile(newMemoList, author)
    })
  },
})

function getAuthor() {
  const authorEl = document.querySelector('h2')
  const author = authorEl?.innerHTML ?? ''
  return author
}

async function getMemos(memos: HTMLDivElement) {
  const memosElList = memos.children

  const memoResultList: IMemoResult[] = []

  for (let i = 0; i < memosElList.length; i++) {
    const memoEl = memosElList[i] as HTMLDivElement

    // 时间
    const timeEl = memoEl.querySelector('time')

    // 此时到了未激活状态的最后一条
    if (!timeEl) break

    const time = dayjs(timeEl?.getAttribute('datetime') ?? '').format(
      FILE_DATE_FORMAT
    )

    // === content ===
    const contentEl = memoEl.querySelector('[class*="content_truncate"]')
    const contentHTML = contentEl?.innerHTML ?? ''
    const content = handleHtmlToMd(contentHTML)

    // === content 中的链接 ===
    const contentLinkContainerEl = memoEl.querySelector(
      '[class*="LinkInfo__Container"]'
    )
    const contentLinkEl =
      contentLinkContainerEl?.parentNode as HTMLAnchorElement
    const contentLinkText =
      contentLinkContainerEl?.querySelector('[class*="LinkInfo__StyledText"]')
        ?.innerHTML ?? ''
    const contentLinkHref = contentLinkEl?.getAttribute('href') ?? ''

    // ==== 图片 ====
    const imgSrcList: string[] = []
    const imageContainerEl = memoEl.querySelector(
      '[class*="MessagePictureGrid"]'
    )
    // 单一图片
    const singleImageEl = imageContainerEl?.querySelector('img')
    if (singleImageEl) {
      imgSrcList.push(singleImageEl.getAttribute('src') as string)
    }
    // 多张图片
    const multiImageEl = imageContainerEl?.querySelectorAll(
      '[class*="MessagePictureGrid__Cell"]'
    )
    if (multiImageEl && multiImageEl?.length > 0) {
      const multiImageList = await processAllImages(multiImageEl)
      imgSrcList.push(...multiImageList)
    }

    // ==== 引用动态 ====
    const quoteEl = memoEl.querySelector('[class*="RepostContent__StyledText"]')
    const quoteHTML = quoteEl?.innerHTML ?? ''
    const quote = quoteHTML
    // 引用动态所属圈子
    const quoteCircleEl = memoEl.querySelector(
      '[class*="RepostContent__TopicText"]'
    )
    const quoteCircleHref = quoteCircleEl?.getAttribute('href') ?? ''
    const quoteCircleLink = quoteCircleHref ? getJikeUrl(quoteCircleHref) : ''
    const quoteCircleText = quoteCircleEl?.innerHTML ?? ''

    // ==== 动态链接 ====
    const memoLinkEl = memoEl.querySelector('article time')
      ?.parentNode as HTMLAnchorElement
    const memoHref = memoLinkEl.getAttribute('href') ?? ''
    const memoLink = memoHref ? getJikeUrl(memoHref) : ''

    // ==== 动态圈子 ===
    const memoCircleEl = memoEl.querySelector(
      'article div:nth-child(2) div:nth-child(3) a'
    )
    const memoCircleHref = memoCircleEl?.getAttribute('href') ?? ''
    const memoCircleLink = memoCircleHref ? getJikeUrl(memoCircleHref) : ''
    const memoCircleText =
      (memoCircleEl?.textContent || memoCircleEl?.textContent) ?? ''

    memoResultList.push({
      time,
      content,
      contentCircle:
        contentLinkHref && contentLinkText
          ? {
              title: contentLinkText,
              url: contentLinkHref,
            }
          : null,
      quote,
      quoteCircle:
        quoteCircleLink && quoteCircleText
          ? {
              title: quoteCircleText,
              url: quoteCircleLink,
            }
          : null,
      memoLink,
      memoCircle:
        memoCircleLink && memoCircleText
          ? {
              title: memoCircleText,
              url: memoCircleLink,
            }
          : null,
      files: imgSrcList,
    })
  }

  return memoResultList
}

function handleHtmlToMd(htmlString: string) {
  const mdString = html2md(htmlString)

  const result = mdString
    .replace(/\\#/g, '#') // 标签
    .replace(/\\---/g, '---') // 分隔线
    .replace(/\\- /g, '- ') // 无序列表
    .replace(/\\\. /g, '. ') // 有序列表
    .replace(/\\\*\\\*/g, '**') // 加粗
    .replace(/\*\*(#.+?)\*\*/g, '$1') // 去除 #Tag 的加粗效果

  return result
}

async function handleExportAsMultiFile(memos: IMemoResult[], fileName: string) {
  const zip = new Jszip()

  // 文件下载任务
  const filesTask: Promise<void>[] = []

  memos.forEach((memo) => {
    const content = memo.content
    zip.file(`${memo.time}.md`, content)

    // 下载图片
    memo.files.forEach((url, i) => {
      if (url) {
        const promise = fetch(url)
          .then((res) => res.blob())
          .then((blob) => {
            zip.file(`images/${memo.time}_${i + 1}.png`, blob)
          })
        filesTask.push(promise)
      }
    })
  })

  // 完成所有图片下载任务
  await Promise.all(filesTask)

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

async function handleExportAsSingleFile(
  memos: IMemoResult[],
  fileName: string
) {
  const zip = new Jszip()

  // 文件下载任务
  const filesTask: Promise<void>[] = []

  // 完成内容
  let resultContent = ''

  // 按照时间降序排列
  memos
    .sort((a, b) => {
      return dayjs(formatMdTime(a.time)).isAfter(dayjs(formatMdTime(b.time)))
        ? -1
        : 1
    })
    .forEach((memo) => {
      const content = memo.content
      resultContent += `\n\n## ${dayjs(formatMdTime(memo.time)).format(
        DATE_FORMAT
      )}\n\n${content}\n\n`

      // 下载图片
      memo.files.forEach((url, i) => {
        if (url) {
          const promise = fetch(url)
            .then((res) => res.blob())
            .then((blob) => {
              zip.file(`images/${memo.time}_${i + 1}.png`, blob)
            })
          filesTask.push(promise)
        }
      })
    })

  // 完成所有图片下载任务
  await Promise.all(filesTask)

  zip.file(`${fileName}.md`, resultContent)

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

function autoScroll(isVerified: boolean): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const isScrollBottom = () => {
      const result = document.querySelector(
        '[class*="LoadingIndicator__Container"]'
      )
      return result === null
    }

    const scrollBottom = () => {
      window.scrollTo(0, document.body.scrollHeight)
    }

    const quit = () => {
      clearInterval(intervalId)
      resolve(true)
    }

    // 标记在非激活的场景下，只用滚动 3 次就好
    let scrollCount = 0

    const intervalId = setInterval(() => {
      if (isScrollBottom()) {
        quit()
      } else {
        scrollCount += 1

        if (!isVerified && scrollCount >= 3) {
          quit()
        }

        scrollBottom()
      }
    }, 1 * 1000)
  })
}

function getJikeUrl(subUrl: string) {
  return `https://web.okjike.com${subUrl}`
}

// 获取动态中多图片
async function processAllImages(
  imageElements: NodeListOf<Element>
): Promise<string[]> {
  const multiImageList: string[] = []

  for (let i = 0; i < imageElements.length; i++) {
    try {
      // 获取元素的计算样式
      const style = window.getComputedStyle(imageElements[i])
      // 提取background-image属性值
      let backgroundImage = style.getPropertyValue('background-image')

      // 如果background-image是URL, 提取URL部分
      if (backgroundImage.startsWith('url')) {
        // 去掉"url("和")"，并处理可能的引号
        backgroundImage = backgroundImage.slice(4, -1).replace(/["']/g, '')
        multiImageList.push(backgroundImage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return multiImageList
}

// 将 markdown 文件的时间转化为可以被 dayjs 识别的时间
function formatMdTime(time: string): string {
  return time
    .split('_')
    .map((item, index) => {
      if (index === 1) {
        return item.replaceAll('-', ':')
      } else {
        return item
      }
    })
    .join(' ')
}
