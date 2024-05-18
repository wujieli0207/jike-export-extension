import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import { IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime } from '../exportHelper'
import { DATE_FORMAT } from '../../config'
import html2md from 'html-to-md'

// === 导出为 markdown 文件 ===
export async function handleExportAsMultiFile(
  memos: IMemoResult[],
  fileName: string,
  isDownloadImage: boolean
) {
  const zip = new Jszip()

  // 文件下载任务
  const filesTask: Promise<void>[] = []

  memos.forEach((memo) => {
    const content = memo.content
    zip.file(`${memo.time}.md`, content)

    // 下载图片
    if (isDownloadImage) {
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
    }
  })

  // 完成所有图片下载任务
  if (filesTask.length > 0) {
    await Promise.all(filesTask)
  }

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

export async function handleExportAsSingleFile(
  memos: IMemoResult[],
  fileName: string,
  isDownloadImage: boolean
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
      if (isDownloadImage) {
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
      }
    })

  // 完成所有图片下载任务
  if (filesTask.length > 0) {
    await Promise.all(filesTask)
  }

  zip.file(`${fileName}.md`, resultContent)

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

export function handleHtmlToMd(htmlString: string) {
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
