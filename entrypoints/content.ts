import { EXPORT_TYPE } from './popup/config'
import { IMessage } from './popup/types'

export default defineContentScript({
  // matches: ['*://*.okjike.com/*'],
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  main(ctx) {
    console.log('Content script loaded.') // 确认内容脚本加载

    browser.runtime.onMessage.addListener(async function (message: IMessage) {
      console.log('message: ', message)
      if (message.type === EXPORT_TYPE) {
        const memos = document.getElementById('react-tabs-1')
        // ! TODO 完成导出功能
      }
    })
  },
})
