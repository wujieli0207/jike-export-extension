import { EXPORT_TYPE } from './config'

export interface IUserInfo {
  isVerify: true // 是否输入验证码，默认为 false
}

export interface IMessage {
  type: typeof EXPORT_TYPE
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
