// @ts-ignore
import FileSaver from 'file-saver'
// @ts-ignore
import Papa from 'papaparse'
import { IExportConfig, IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime } from '../exportHelper'
import { DATE_FORMAT } from '../../config'
import { ContentOrderTypeEnum } from '../../const/exportConst'

export async function handleExportAsSingleCsvFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const { contentOrder } = options

  // 按照时间排序
  memos.sort((a, b) => {
    const timeA = dayjs(formatMdTime(a.time)).valueOf()
    const timeB = dayjs(formatMdTime(b.time)).valueOf()
    if (contentOrder === ContentOrderTypeEnum.ASC) {
      return timeA - timeB
    } else {
      return timeB - timeA
    }
  })

  // 准备 CSV 数据
  const csvData = memos.map((memo) => ({
    时间: dayjs(formatMdTime(memo.time)).format(DATE_FORMAT),
    作者: fileName,
    内容: memo.rawContent,
    动态链接: memo.memoLink,
    动态圈子: memo.memoCircle?.title ?? '',
  }))

  // 使用 PapaParse 生成 CSV 内容
  const csvContent = Papa.unparse(csvData)

  // 添加 BOM 以确保在 Excel 中正确显示
  const bom = '\uFEFF'
  const csvWithBom = bom + csvContent

  // 创建一个 Blob 对象
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8' })

  // 使用 FileSaver 保存文件
  FileSaver.saveAs(blob, `${fileName}.csv`)
}
