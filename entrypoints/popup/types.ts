import { EXPORT_TYPE } from './config'

export interface IMessage {
  type: typeof EXPORT_TYPE
}

export interface IMemoCircle {
  title: string
  url: string
}

export interface IMemoResult {
  time: string
  content: string
  quote: string // 回复动态
  memoLink: string
  memoCircle: IMemoCircle | null
  files: string[]
}
