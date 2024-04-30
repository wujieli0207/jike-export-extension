import { EXPORT_TYPE } from './config'

export interface IVerifyResult {
  isVerified: boolean // 是否通过密钥验证通过
  verifiedLisence: string // 验证通过后的密钥
}

export interface IExportConfig {
  isSingleFile: boolean // 是否导出为单一文件
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
  content: string
  quote: string // 回复动态
  quoteCircle: ILink | null // 回复动态的圈子
  memoLink: string
  memoCircle: ILink | null
  files: string[]
}
