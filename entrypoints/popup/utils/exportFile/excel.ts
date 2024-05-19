// @ts-ignore
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import { IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime } from '../exportHelper'
import { DATE_FORMAT } from '../../config'

export async function handleExportAsSingleExcelFile(
  memos: IMemoResult[],
  fileName: string
) {
  // 按照时间降序排列
  memos.sort((a, b) => {
    return dayjs(formatMdTime(a.time)).isAfter(dayjs(formatMdTime(b.time)))
      ? -1
      : 1
  })

  // 准备 Excel 数据
  const excelData = memos.map((memo) => ({
    时间: dayjs(formatMdTime(memo.time)).format(DATE_FORMAT),
    作者: fileName,
    内容: memo.rawContent,
    动态链接: memo.memoLink,
    动态圈子: memo.memoCircle?.title ?? '',
  }))

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // 创建工作簿并添加工作表
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Memos')

  // 生成 Excel 文件的 Blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })

  // 使用 FileSaver 保存文件
  FileSaver.saveAs(blob, `${fileName}.xlsx`)
}
