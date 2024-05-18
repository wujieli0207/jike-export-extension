import { IExportConfig, IMemoResult } from '../../types'
import { ExportTypeEnum } from '../../const/exportConst'
import { handleExportAsMultiFile, handleExportAsSingleFile } from './markdown'

export function handleExportFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const { fileType, isSingleFile, isDownloadImage } = options
  if (fileType === ExportTypeEnum.MD) {
    isSingleFile
      ? handleExportAsSingleFile(memos, fileName, isDownloadImage)
      : handleExportAsMultiFile(memos, fileName, isDownloadImage)
  }
}
