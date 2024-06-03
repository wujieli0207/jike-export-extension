import { Dayjs } from 'dayjs'
import { EXPORT_TYPE } from './config'
import {
  ContentOrderTypeEnum,
  ExportTypeEnum,
  FastDateRangeEnum,
  moreFilterEnum,
} from './const/exportConst'

export interface IVerifyResult {
  isVerified: boolean // 是否通过密钥验证通过
  verifiedLisence: string // 验证通过后的密钥
}

export interface IExportConfig {
  fileType: ExportTypeEnum // 导出文件类型
  isSingleFile: boolean // 是否导出为单一文件
  isDownloadImage: boolean // 是否下载图片
  contentOrder: ContentOrderTypeEnum // 内容排序，仅适用于单文件
  fastDateRange: FastDateRangeEnum // 快速日期范围
  startDate: Dayjs | null // 开始日期
  endDate: Dayjs | null // 结束日期
  moreFilter: moreFilterEnum | null // 是否开启更多筛选
}

export interface IMessage {
  type: typeof EXPORT_TYPE
  isVerified: boolean // 是否通过密钥验证通过
  config: IExportConfig
}

export interface ILink {
  title: string
  url: string
}

export interface IMemoResult {
  time: string
  rawContent: string // 原始文本
  content: string // markdown 文本的内容
  contentCircle: ILink | null // 内容附带的链接
  quote: string // 回复动态
  quoteCircle: ILink | null // 回复动态的圈子
  memoLink: string
  memoCircle: ILink | null
  files: string[]
}
