import { EXPORT_TYPE } from './config'

export interface IMessage {
  type: typeof EXPORT_TYPE
}

export interface IMemoResult {
  time: string
  content: string
  quote: string // 回复动态
  files: string[]
}
