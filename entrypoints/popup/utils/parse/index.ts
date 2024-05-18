import { ExportTypeEnum } from '../../const/exportConst'
import { IExportConfig, IMemoResult } from '../../types'
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

  if (fileType === ExportTypeEnum.MD) {
    return markdownParse(memoList, options)
  }

  if (fileType === ExportTypeEnum.TXT) {
    return txtParse(memoList, options)
  }

  return memoList
}
