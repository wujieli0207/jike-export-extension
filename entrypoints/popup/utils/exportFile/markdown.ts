import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import { IExportConfig, IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime, getFileNameTimestamp } from '../exportHelper'
import { DATE_FORMAT } from '../../config'
import html2md from 'html-to-md'
import { ContentOrderTypeEnum } from '../../const/exportConst'

// === 导出为 markdown 文件 ===
export async function handleExportAsMultiMarkdownFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const { isDownloadImage } = options

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

export async function handleExportAsSingleMarkdownFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const {
    isSingleFile,
    isDownloadImage,
    isFileNameAddTimestamp,
    contentOrder,
  } = options

  // 完成内容
  let resultContent = ''

  // 按照时间排序，拼接时间标题
  memos
    .sort((a, b) => {
      const timeA = dayjs(formatMdTime(a.time)).valueOf()
      const timeB = dayjs(formatMdTime(b.time)).valueOf()
      if (contentOrder === 'asc') {
        return timeA - timeB
      } else {
        return timeB - timeA
      }
    })
    .forEach((memo) => {
      const content = memo.content
      resultContent += `\n\n## ${dayjs(formatMdTime(memo.time)).format(
        DATE_FORMAT
      )}\n\n${content}\n\n`
    })

  // 单文件下载，并且不用单独下载图片，直接导出为 markdown 文件
  if (isSingleFile && !isDownloadImage) {
    // 创建一个 Blob 对象
    const blob = new Blob([resultContent], {
      type: 'text/markdown;charset=utf-8',
    })
    // 使用 FileSaver 保存文件
    FileSaver.saveAs(
      blob,
      `${fileName}${
        isFileNameAddTimestamp ? `-${getFileNameTimestamp()}` : ''
      }.md`
    )
  }
  // 其他场景使用 zip 打包下载
  else {
    const zip = new Jszip()

    // 文件下载任务
    const filesTask: Promise<void>[] = []

    // 处理下载图片
    memos.forEach((memo) => {
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
