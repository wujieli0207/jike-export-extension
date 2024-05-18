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
      const response = await fetch(
        'https://api.lemonsqueezy.com/v1/licenses/validate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            license_key: newLicenseKey,
          }),
        }
      )
      const result = await response.json() // 可以使用这个来进行额外的操作

      isVerified = result.valid

      storage.setItem<IVerifyResult>(VERIFY_RESULT, {
        isVerified: !!result.valid,
        verifiedLisence: result.license_key?.key ?? '',
      })
    } catch (error) {
      console.error('error: ', error)
    }
  }

  return isVerified
}
