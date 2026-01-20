import { EXPORT_CONFIG, NEW_LICENSE_KEY, VERIFY_RESULT } from '../config'
import { IExportConfig, IVerifyResult } from '../types'

// 获取输入的 lincense key
export async function getLocalExportConfig() {
  const exportConfig = await storage.getItem<string>(EXPORT_CONFIG)
  return JSON.parse(exportConfig ?? '{}') as IExportConfig
}

// 获取输入的 lincense key
export async function getNewLicenseKey() {
  const newLicenseKey = await storage.getItem<string>(NEW_LICENSE_KEY)
  return newLicenseKey
}

// 获取验证结果
export async function getUserInfo() {
  // 输入的密钥
  const newLicenseKey = await getNewLicenseKey()
  // 验证信息
  const verifiedResult = await storage.getItem<IVerifyResult>(VERIFY_RESULT)

  let isVerified = verifiedResult?.isVerified ?? false

  // 如果输入的密钥和验证的密钥不同，需要调用服务请求验证
  if (newLicenseKey && verifiedResult?.verifiedLisence !== newLicenseKey) {
    try {
      // 通过 background script 验证 license
      const response = await browser.runtime.sendMessage({
        action: 'validateLicense',
        licenseKey: newLicenseKey,
      })

      if (response?.success && response?.data) {
        const result = response.data

        isVerified = result.valid

        storage.setItem<IVerifyResult>(VERIFY_RESULT, {
          isVerified: !!result.valid,
          verifiedLisence: result.license_key?.key ?? '',
        })
      } else {
        console.error('License validation failed:', response?.error)
      }
    } catch (error) {
      console.error('error: ', error)
    }
  }

  return isVerified
}
