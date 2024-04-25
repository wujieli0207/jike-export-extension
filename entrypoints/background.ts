export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  // 转发来自 popup 的消息
  browser.runtime.onMessage.addListener(function (requset) {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const activeTab = tabs[0]
      const tid = activeTab.id ?? -1

      if (activeTab && tid > 0) {
        browser.tabs.sendMessage(tid, requset)
      }
    })
  })
})
