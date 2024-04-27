const USER_INFO_KEY = 'local:userInfo'

export async function getUserInfo() {
  await storage.setItem(USER_INFO_KEY, '123')

  const userInfo = await storage.getItem(USER_INFO_KEY)
  console.log('userInfo: ', userInfo)
}
