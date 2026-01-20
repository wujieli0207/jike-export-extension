export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  // 转发来自 popup 的消息
  browser.runtime.onMessage.addListener(function (requset, sender, sendResponse) {
    // 处理 license 验证请求
    if (requset.action === 'validateLicense') {
      fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: requset.licenseKey,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          sendResponse({ success: true, data: result })
        })
        .catch((error) => {
          console.error('License validation error:', error)
          sendResponse({ success: false, error: error.message })
        })

      // 返回 true 表示会异步调用 sendResponse
      return true
    }

    if (requset.action === 'openPreviewTab' && requset.url) {
      browser.tabs.create({ url: requset.url })
    } else {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const activeTab = tabs[0]
        const tid = activeTab?.id ?? -1

        if (activeTab && tid > 0) {
          browser.tabs.sendMessage(tid, requset)
        }
      })
    }
  })
})
