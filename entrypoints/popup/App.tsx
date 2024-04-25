import './App.css'
import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { EXPORT_TYPE, JIKE_URL } from './config'

export default function App() {
  const [isClickExport, setIsClickExport] = useState(false)
  const [inJike, setIsInJike] = useState(false)

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const url = tabs[0].url ?? ''
      setIsInJike(url.includes(JIKE_URL))
    })
  }, [])

  const handleExport = async () => {
    setIsClickExport(true)

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const activeTab = tabs[0]
      const tid = activeTab.id ?? -1

      if (activeTab && tid > 0) {
        browser.runtime.sendMessage({
          type: EXPORT_TYPE,
        })
      }
    })
  }

  return (
    <>
      <div className="card">
        {inJike ? (
          <button
            className="button"
            disabled={isClickExport}
            onClick={handleExport}
          >
            {isClickExport ? '导出中，完成后将自动下载...' : '导出'}
          </button>
        ) : (
          <button
            className="button"
            disabled={isClickExport}
            onClick={() =>
              browser.tabs.create({ url: 'https://web.okjike.com/' })
            }
          >
            去即刻中操作
          </button>
        )}
        <p>需要进入即刻动态列表操作</p>
      </div>
      {/* <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p> */}
    </>
  )
}
