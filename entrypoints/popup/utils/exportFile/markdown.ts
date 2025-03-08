import Jszip from 'jszip'
// @ts-ignore
import FileSaver from 'file-saver'
import { IExportConfig, IMemoResult } from '../../types'
import dayjs from 'dayjs'
import { formatMdTime, getFileNameTimestamp } from '../exportHelper'
import { DATE_FORMAT } from '../../config'

// === 导出为 markdown 文件 ===
export async function handleExportAsMultiMarkdownFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const { isDownloadImage } = options

  const zip = new Jszip()
  const failedImages: string[] = []

  // 文件下载任务
  const filesTask: Promise<void>[] = []

  memos.forEach((memo) => {
    const content = memo.content
    zip.file(`${memo.time}.md`, content)

    // 下载图片
    if (isDownloadImage) {
      memo.files.forEach((url, i) => {
        if (url) {
          const promise = downloadImage(url)
            .then((blob) => {
              if (blob) {
                zip.file(`images/${memo.time}_${i + 1}.png`, blob)
              } else {
                failedImages.push(url)
                console.warn(`Failed to download image: ${url}`)
              }
            })
            .catch((error) => {
              failedImages.push(url)
              console.error(`Error downloading image ${url}:`, error)
            })
          filesTask.push(promise)
        }
      })
    }
  })

  // 完成所有图片下载任务
  if (filesTask.length > 0) {
    await Promise.allSettled(filesTask)
  }

  // 如果有失败的图片，添加一个文件记录失败的URL
  if (failedImages.length > 0) {
    const failedImagesContent = `# 下载失败的图片\n\n以下图片下载失败，您可以手动下载：\n\n${failedImages
      .map((url) => `- ${url}`)
      .join('\n')}`
    zip.file('failed_images.md', failedImagesContent)
  }

  const result = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(result, `${fileName}.zip`)
}

export async function handleExportAsSingleMarkdownFile(
  memos: IMemoResult[],
  fileName: string,
  options: IExportConfig
) {
  const {
    isSingleFile,
    isDownloadImage,
    isFileNameAddTimestamp,
    contentOrder,
  } = options

  // 完成内容
  let resultContent = ''
  const failedImages: string[] = []

  // 按照时间排序，拼接时间标题
  memos
    .sort((a, b) => {
      const timeA = dayjs(formatMdTime(a.time)).valueOf()
      const timeB = dayjs(formatMdTime(b.time)).valueOf()
      if (contentOrder === 'asc') {
        return timeA - timeB
      } else {
        return timeB - timeA
      }
    })
    .forEach((memo) => {
      const content = memo.content
      resultContent += `\n\n## ${dayjs(formatMdTime(memo.time)).format(
        DATE_FORMAT
      )}\n\n${content}\n\n`
    })

  // 单文件下载，并且不用单独下载图片，直接导出为 markdown 文件
  if (isSingleFile && !isDownloadImage) {
    // 创建一个 Blob 对象
    const blob = new Blob([resultContent], {
      type: 'text/markdown;charset=utf-8',
    })
    // 使用 FileSaver 保存文件
    FileSaver.saveAs(
      blob,
      `${fileName}${
        isFileNameAddTimestamp ? `-${getFileNameTimestamp()}` : ''
      }.md`
    )
  }
  // 其他场景使用 zip 打包下载
  else {
    const zip = new Jszip()

    // 文件下载任务
    const filesTask: Promise<void>[] = []

    // 处理下载图片
    memos.forEach((memo) => {
      if (isDownloadImage) {
        memo.files.forEach((url, i) => {
          if (url) {
            const promise = downloadImage(url)
              .then((blob) => {
                if (blob) {
                  zip.file(`images/${memo.time}_${i + 1}.png`, blob)
                } else {
                  failedImages.push(url)
                  console.warn(`Failed to download image: ${url}`)
                }
              })
              .catch((error) => {
                failedImages.push(url)
                console.error(`Error downloading image ${url}:`, error)
              })
            filesTask.push(promise)
          }
        })
      }
    })

    // 完成所有图片下载任务 - 使用 Promise.allSettled 确保即使部分失败也能继续
    if (filesTask.length > 0) {
      await Promise.allSettled(filesTask)
    }

    zip.file(`${fileName}.md`, resultContent)

    // 如果有失败的图片，添加一个文件记录失败的URL
    if (failedImages.length > 0) {
      const failedImagesContent = `# 下载失败的图片\n\n以下图片下载失败，您可以手动下载：\n\n${failedImages
        .map((url) => `- ${url}`)
        .join('\n')}`
      zip.file('failed_images.md', failedImagesContent)
    }

    const result = await zip.generateAsync({ type: 'blob' })
    FileSaver.saveAs(result, `${fileName}.zip`)
  }
}

// 尝试下载图片，带有重试和错误处理
async function downloadImage(url: string, retries = 2): Promise<Blob | null> {
  try {
    // 添加随机参数避免缓存问题
    const urlWithParam = url.includes('?')
      ? `${url}&_t=${Date.now()}`
      : `${url}?_t=${Date.now()}`

    const response = await fetch(urlWithParam, {
      method: 'GET',
      headers: {
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://web.okjike.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      },
      // 设置模式为 no-cors 可能会帮助绕过某些CORS限制，但会限制响应的使用
      // mode: 'no-cors',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.blob()
  } catch (error) {
    console.error(`Error fetching image ${url}:`, error)

    // 如果还有重试次数，则重试
    if (retries > 0) {
      console.log(`Retrying download for ${url}, ${retries} attempts left`)
      // 延迟一段时间后重试
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return downloadImage(url, retries - 1)
    }

    return null
  }
}
