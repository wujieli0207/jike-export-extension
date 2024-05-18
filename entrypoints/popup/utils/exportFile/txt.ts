import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import { IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime } from '../exportHelper'
import { DATE_FORMAT } from '../../config'
// @ts-ignore
import { convert } from 'html-to-text'

// === 导出为 txt 文件 ===
// txt 没有图片下载任务
export async function handleExportAsMultiTxtFile(
  memos: IMemoResult[],
  fileName: string
) {
  const zip = new Jszip()

  memos.forEach((memo) => {
    const rawContent = memo.rawContent
    zip.file(`${memo.time}.txt`, rawContent)
  })

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

export async function handleExportAsSingleTxtFile(
  memos: IMemoResult[],
  fileName: string
) {
  const zip = new Jszip()

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
      const rawContent = memo.rawContent
      resultContent += `\n\n========== ${dayjs(formatMdTime(memo.time)).format(
        DATE_FORMAT
      )} ==========\n\n${rawContent}\n\n`
    })

  zip.file(`${fileName}.txt`, resultContent)

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

export function handleHtmlToTxt(htmlString: string) {
  const txtString = convert(htmlString)
  const result = txtString
    // 回复动态后面的链接
    .replace(/\[\/u\/[a-z0-9-]+\]/gi, '')

  return result
}
