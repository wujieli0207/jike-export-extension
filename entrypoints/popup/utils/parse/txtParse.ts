import { IExportConfig, IMemoResult } from '../../types'

/**
 * @description 解析 txt 文件格式的数据内容
 */
export function txtParse(
  memoList: IMemoResult[],
  _options: IExportConfig
): IMemoResult[] {
  return memoList.map((memo) => {
    let rawContent = memo.rawContent

    // 内容的附带的链接
    if (memo.contentCircle) {
      rawContent += `\n\n${memo.contentCircle.title}: ${memo.contentCircle.url}`
    }

    // 动态链接
    if (memo.memoLink) {
      rawContent += `\n\n原动态链接: ${memo.memoLink}`
    }

    // 所属圈子
    if (memo.memoCircle) {
      rawContent += `\n\n圈子: ${memo.memoCircle.title}\n圈子链接: ${memo.memoCircle.url}`
    }

    // 引用动态
    if (memo.quote) {
      rawContent += `\n\n---\n\n> 引用动态：\n\n${memo.quote}`
    }
    // 引用动态的圈子
    if (memo.quoteCircle) {
      rawContent += `\n\n引用动态圈子: ${memo.quoteCircle.title}\n引用动态圈子链接: ${memo.quoteCircle.url}`
    }

    // txt 文件中不处理图片

    return {
      ...memo,
      rawContent,
    }
  })
}
