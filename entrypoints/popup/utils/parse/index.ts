import { ExportTypeEnum } from '../../const/exportConst'
import { IExportConfig, IMemoResult } from '../../types'
import { csvParse } from './csvParse'
import { excelParse } from './excelParse'
import { markdownParse } from './markdownParse'
import { txtParse } from './txtParse'

/**
 * @description 解析不同文件格式的数据内容
 */
export function contentParse(
  memoList: IMemoResult[],
  options: IExportConfig
): IMemoResult[] {
  const { fileType } = options

  const parse: Record<
    ExportTypeEnum,
    (memoList: IMemoResult[], options: IExportConfig) => IMemoResult[]
  > = {
    [ExportTypeEnum.MD]: markdownParse,
    [ExportTypeEnum.TXT]: txtParse,
    [ExportTypeEnum.CSV]: csvParse,
    [ExportTypeEnum.EXCEL]: excelParse,
  }

  const parseFn = parse[fileType]

  if (parseFn) {
    return parseFn(memoList, options)
  } else {
    return memoList
  }
}
