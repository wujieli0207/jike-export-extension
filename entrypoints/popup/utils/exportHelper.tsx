import ReactDOM from 'react-dom/client'
import Loading from '../components/Loading'
import { EXPORT_TIPS } from '../config'

export function globalLoading(ctx) {
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
