import { IExportConfig, IMemoResult } from '../../types'

/**
 * @description 解析 markdown 文件格式的数据内容
 */
export function markdownParse(
  memoList: IMemoResult[],
  options: IExportConfig
): IMemoResult[] {
  const { isDownloadImage } = options
  return memoList.map((memo) => {
    let content = memo.content

    // 内容的附带的链接
    if (memo.contentCircle) {
      content += `\n\n[${memo.contentCircle.title}](${memo.contentCircle.url})`
    }

    // 动态链接
    if (memo.memoLink) {
      content += `\n\n[原动态链接](${memo.memoLink})`
    }

    // 所属圈子
    if (memo.memoCircle) {
      content += `\n\n圈子: [${memo.memoCircle.title}](${memo.memoCircle.url})`
    }

    // 引用动态
    if (memo.quote) {
      content += `\n\n---\n\n> 引用动态：\n\n${memo.quote}`
    }
    // 引用动态的圈子
    if (memo.quoteCircle) {
      content += `\n\n引用动态圈子: [${memo.quoteCircle.title}](${memo.quoteCircle.url})`
    }

    // 文件链接至 momo 中
    if (memo.files.length > 0) {
      // 下载图片的情况
      if (isDownloadImage) {
        content += `\n${memo.files
          .map((_item, i) => `\n![image](images/${memo.time}_${i + 1}.png)`)
          .join('\n')}`
      }
      // 不用下载图片
      else {
        content += `\n${memo.files
          .map((item) => `\n![image](${item})`)
          .join('\n')}`
      }
    }

    return {
      ...memo,
      content,
    }
  })
}
