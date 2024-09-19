import ReactDOM from 'react-dom/client'
import Loading from '../components/Loading'
import { DATE_FORMAT_SHORT, EXPORT_TIPS, FILE_DATE_FORMAT } from '../config'
import dayjs, { Dayjs } from 'dayjs'
import { IExportConfig, IMemoResult } from '../types'
import { moreFilterEnum } from '../const/exportConst'

export function globalLoading(ctx: any) {
  const app = createIntegratedUi(ctx, {
    position: 'inline',
    onMount: (container) => {
      const app = document.createElement('div')
      container.append(app)
      const root = ReactDOM.createRoot(app)
      root.render(<Loading tip={EXPORT_TIPS} />)
      return root
    },
  })

  function openLoading() {
    app.mount()
    const loadingEl = app.wrapper
    loadingEl.style.display = 'flex'
    loadingEl.style.alignItems = 'center'
    loadingEl.style.justifyContent = 'center'
    loadingEl.style.position = 'fixed'
    loadingEl.style.inset = '0'
    loadingEl.style.width = '100%'
    loadingEl.style.height = '100%'
    loadingEl.style.zIndex = '9999'
    loadingEl.style.backgroundColor = 'rgb(0 0 0 / 50%)'
  }

  function closeLoading() {
    if (app) {
      app.remove()
    }
  }

  return {
    openLoading,
    closeLoading,
  }
}

export function autoScroll(
  isVerified: boolean,
  startDate: Dayjs | null,
  memoSelector: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const isScrollBottom = () => {
      const result = document.querySelector(
        '[class*="LoadingIndicator__Container"]'
      )
      return result === null
    }

    const scrollBottom = () => {
      window.scrollTo(0, document.body.scrollHeight)
    }

    const quit = () => {
      clearInterval(intervalId)
      resolve(true)
    }

    // 是否在开始日期之前
    const isAtStartDate = () => {
      if (startDate) {
        const totalMemos = document.querySelector(
          memoSelector
        ) as HTMLDivElement | null

        if (!totalMemos) return false

        const memosElList = totalMemos.children
        // 没有到底部时，最后一条是 loading，loading 的前一条是动态
        const lastMemo = memosElList[memosElList.length - 2]
        const timeEl = lastMemo.querySelector('time')

        if (!timeEl) return false

        const currentDate = dayjs(
          timeEl?.getAttribute('datetime') ?? ''
        ).format(DATE_FORMAT_SHORT)

        // 判断传入的开始日期是否在 当前最新动态时间 之前
        return dayjs(dayjs(startDate).format(DATE_FORMAT_SHORT)).isAfter(
          dayjs(currentDate)
        )
      }

      return false
    }

    // 标记在非激活的场景下，只用滚动 3 次就好
    let scrollCount = 0

    const intervalId = setInterval(() => {
      if (isScrollBottom() || isAtStartDate()) {
        quit()
      } else {
        scrollCount += 1

        if (!isVerified && scrollCount >= 3) {
          quit()
        }

        scrollBottom()
      }
    }, 1 * 1000)
  })
}

// 将 markdown 文件的时间转化为可以被 dayjs 识别的时间
export function formatMdTime(time: string): string {
  return time
    .split('_')
    .map((item, index) => {
      if (index === 1) {
        return item.replaceAll('-', ':')
      } else {
        return item
      }
    })
    .join(' ')
}

export function getJikeUrl(subUrl: string) {
  return `https://web.okjike.com${subUrl}`
}

// 获取动态中多图片
export async function processAllImages(
  imageElements: NodeListOf<Element>
): Promise<string[]> {
  const multiImageList: string[] = []

  for (let i = 0; i < imageElements.length; i++) {
    try {
      // 获取元素的计算样式
      const style = window.getComputedStyle(imageElements[i])
      // 提取background-image属性值
      let backgroundImage = style.getPropertyValue('background-image')

      // 如果background-image是URL, 提取URL部分
      if (backgroundImage.startsWith('url')) {
        // 去掉"url("和")"，并处理可能的引号
        backgroundImage = backgroundImage.slice(4, -1).replace(/["']/g, '')
        // 去除图片后面的参数，直接加载原图
        backgroundImage = getImageUrl(backgroundImage)
        multiImageList.push(backgroundImage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return multiImageList
}

// 处理图片链接
export function getImageUrl(url: string): string {
  // 特殊处理苹果图片参数，截取 jpeg 的参数
  if (url.includes('heic')) {
    return url.replace(/(jpeg).*$/, 'jpeg')
  }

  // 去除图片后面的参数，直接加载原图
  return url.split('?')[0]
}

// TOOD 该方法待验证
export function memoListFilter(
  memoList: IMemoResult[],
  isVerified: boolean,
  config: IExportConfig
) {
  const { startDate, endDate, moreFilter } = config

  let resultList = memoList.slice()

  if (startDate) {
    const startTime = dayjs(dayjs(startDate).format(DATE_FORMAT_SHORT))
    resultList = resultList.filter((item) => {
      const currentTime = item.time.split('_')[0]
      return (
        dayjs(currentTime).isAfter(startTime) ||
        dayjs(currentTime).isSame(startTime)
      )
    })
  }
  if (endDate) {
    const endTime = dayjs(dayjs(endDate).format(DATE_FORMAT_SHORT))
    resultList = resultList.filter((item) => {
      const currentTime = item.time.split('_')[0]
      return (
        dayjs(currentTime).isBefore(endTime) ||
        dayjs(currentTime).isSame(endTime)
      )
    })
  }

  if (moreFilter === moreFilterEnum.ONLY_PICTURE) {
    resultList = resultList.filter((item) => item.files.length > 0)
  }
  if (moreFilter === moreFilterEnum.EXCLUDE_PICTURE) {
    resultList = resultList.filter((item) => item.files.length === 0)
  }

  return isVerified ? resultList : resultList.slice(0, 50)
}

export function getFileNameTimestamp() {
  return dayjs().format(FILE_DATE_FORMAT)
}
