import html2md from 'html-to-md'
import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import dayjs from 'dayjs'
import { EXPORT_TYPE } from './popup/config'
import { IMemoResult, IMessage } from './popup/types'

const DATE_FORMAT = 'YYYY-MM-DD_HH:mm:ss'

export default defineContentScript({
  // matches: ['*://*.okjike.com/*'],
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  main(ctx) {
    browser.runtime.onMessage.addListener(async function (message: IMessage) {
      if (message.type !== EXPORT_TYPE) return

      const memos = document.querySelector(
        '#react-tabs-1 > div > div'
      ) as HTMLDivElement | null
      if (!memos) return

      const memoList = getMemos(memos)

      // 数据二次处理
      const newMemoList = memoList.map((memo) => {
        // 文件链接至 momo 中
        return {
          ...memo,
          content:
            memo.content +
            `\n${memo.files
              .map((_item, i) => `\n![image](images/${memo.time}_${i + 1}.png)`)
              .join('\n')}`,
        }
      })

      // 下载笔记
      handleExport(newMemoList)
    })
  },
})

function getMemos(memos: HTMLDivElement) {
  const memosElList = memos.children

  const memoResultList: IMemoResult[] = []

  for (let i = 0; i < memosElList.length; i++) {
    // for (let i = 0; i < 2; i++) {
    const memoEl = memosElList[i] as HTMLDivElement

    // 时间
    const timeEl = memoEl.querySelector('time')
    const time = dayjs(timeEl?.getAttribute('datetime') ?? '').format(
      DATE_FORMAT
    )

    // content
    const contentEl = memoEl.querySelector('[class*="content_truncate"]')
    const contentHTML = contentEl?.innerHTML ?? ''
    const content = handleHtmlToMd(contentHTML)

    // 图片
    const imageEl = memoEl.querySelector('[class*="MessagePictureGrid"] > img')
    const imgSrcList = [imageEl?.getAttribute('src') ?? '']

    memoResultList.push({ time, content, files: imgSrcList })
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

async function handleExport(memos: IMemoResult[]) {
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
  FileSaver.saveAs(result, 'memos.zip')
}
