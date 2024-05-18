import dayjs from 'dayjs'
import { EXPORT_TYPE, FILE_DATE_FORMAT } from './popup/config'
import { IMemoResult, IMessage } from './popup/types'
import {
  globalLoading,
  autoScroll,
  getJikeUrl,
  processAllImages,
} from './popup/utils/exportHelper'
import { handleExportFile } from './popup/utils/exportFile'
import { handleHtmlToMd } from './popup/utils/exportFile/markdown'
import { contentParse } from './popup/utils/parse'
import { handleHtmlToTxt } from './popup/utils/exportFile/txt'

const MEMOS_SELECTOR = '.react-tabs__tab-panel--selected > div > div'

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

      const { openLoading, closeLoading } = globalLoading(ctx)

      openLoading()

      // 等待滚动，获取全部数据
      await autoScroll(isVerified)

      closeLoading()

      const totalMemos = document.querySelector(
        MEMOS_SELECTOR
      ) as HTMLDivElement | null
      if (!totalMemos) return

      const author = getAuthor()
      const memoList = await getMemos(totalMemos)

      // 数据二次处理
      // 未激活场景只取前 50 条
      const newMemoList = contentParse(
        isVerified ? memoList : memoList.slice(0, 50),
        message.config
      )

      // 下载笔记
      handleExportFile(newMemoList, author, message.config)
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
    const rawContent = handleHtmlToTxt(contentHTML)

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
      rawContent,
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
