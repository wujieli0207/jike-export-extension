import ReactDOM from 'react-dom/client'
import Loading from '../components/Loading'
import { EXPORT_TIPS } from '../config'

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

export function autoScroll(isVerified: boolean): Promise<boolean> {
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

    // 标记在非激活的场景下，只用滚动 3 次就好
    let scrollCount = 0

    const intervalId = setInterval(() => {
      if (isScrollBottom()) {
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
