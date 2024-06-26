import { IExportConfig, IMemoResult } from '../../types'
import { ExportTypeEnum } from '../../const/exportConst'
import {
  handleExportAsMultiMarkdownFile,
  handleExportAsSingleMarkdownFile,
} from './markdown'
import { handleExportAsMultiTxtFile, handleExportAsSingleTxtFile } from './txt'
import { handleExportAsSingleCsvFile } from './csv'
import { handleExportAsSingleExcelFile } from './excel'

export function handleExportFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const { fileType, isSingleFile } = options

  if (fileType === ExportTypeEnum.MD) {
    isSingleFile
      ? handleExportAsSingleMarkdownFile(memos, fileName, options)
      : handleExportAsMultiMarkdownFile(memos, fileName, options)
  }

  if (fileType === ExportTypeEnum.TXT) {
    isSingleFile
      ? handleExportAsSingleTxtFile(memos, fileName, options)
      : handleExportAsMultiTxtFile(memos, fileName, options)
  }

  if (fileType === ExportTypeEnum.EXCEL) {
    handleExportAsSingleExcelFile(memos, fileName, options)
  }

  if (fileType === ExportTypeEnum.CSV) {
    handleExportAsSingleCsvFile(memos, fileName, options)
  }
}
