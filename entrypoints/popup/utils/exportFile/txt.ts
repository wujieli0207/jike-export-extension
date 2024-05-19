import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import { IExportConfig, IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime } from '../exportHelper'
import { DATE_FORMAT } from '../../config'
// @ts-ignore
import { convert } from 'html-to-text'
import { ContentOrderTypeEnum } from '../../const/exportConst'

// === 导出为 txt 文件 ===
// txt 没有图片下载任务
export async function handleExportAsMultiTxtFile(
  memos: IMemoResult[],
  fileName: string,
  _options: IExportConfig
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
  fileName: string,
  options: IExportConfig
) {
  const { contentOrder } = options

  // 完成内容
  let resultContent = ''

  // 按照时间降序排列
  memos
    .sort((a, b) => {
      const timeA = dayjs(formatMdTime(a.time)).valueOf()
      const timeB = dayjs(formatMdTime(b.time)).valueOf()
      if (contentOrder === ContentOrderTypeEnum.ASC) {
        return timeA - timeB
      } else {
        return timeB - timeA
      }
    })
    .forEach((memo) => {
      const rawContent = memo.rawContent
      resultContent += `\n\n========== ${dayjs(formatMdTime(memo.time)).format(
        DATE_FORMAT
      )} ==========\n\n${rawContent}\n\n`
    })

  // 创建一个 Blob 对象，直接下载为 txt 文件
  const blob = new Blob([resultContent], { type: 'text/plain;charset=utf-8' })

  // 使用 FileSaver 保存文件
  FileSaver.saveAs(blob, `${fileName}.txt`)
}

export function handleHtmlToTxt(htmlString: string) {
  const txtString = convert(htmlString)
  const result = txtString
    // 回复动态后面的链接
    .replace(/\[\/u\/[a-z0-9-]+\]/gi, '')

  return result
}
