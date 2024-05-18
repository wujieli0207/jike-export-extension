import { IExportConfig, IMemoResult } from '../../types'
import { ExportTypeEnum } from '../../const/exportConst'
import {
  handleExportAsMultiMarkdownFile,
  handleExportAsSingleMarkdownFile,
} from './markdown'
import { handleExportAsMultiTxtFile, handleExportAsSingleTxtFile } from './txt'

export function handleExportFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const { fileType, isSingleFile, isDownloadImage } = options

  if (fileType === ExportTypeEnum.MD) {
    isSingleFile
      ? handleExportAsSingleMarkdownFile(memos, fileName, isDownloadImage)
      : handleExportAsMultiMarkdownFile(memos, fileName, isDownloadImage)
  }

  if (fileType === ExportTypeEnum.TXT) {
    isSingleFile
      ? handleExportAsSingleTxtFile(memos, fileName)
      : handleExportAsMultiTxtFile(memos, fileName)
  }
}
