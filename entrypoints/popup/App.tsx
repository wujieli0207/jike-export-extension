import './App.css'
import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { storage } from 'wxt/storage'
import { Button, Checkbox, Divider, Form, FormProps, Input } from 'antd'
import { EXPORT_TYPE, JIKE_URL, NEW_LICENSE_KEY } from './config'
import { getNewLicenseKey, getUserInfo } from './utils'
import { IExportConfig, IMessage } from './types'

type FieldType = {
  newLicenseKey?: string
}

export default function App() {
  const [form] = Form.useForm()

  const [isClickExport, setIsClickExport] = useState(false)
  const [inJike, setIsInJike] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(false)

  const [exportConfig, setExportConfig] = useState<IExportConfig>({
    isSingleFile: false,
  })

  useEffect(() => {
    // 判断是不是在即刻中
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const url = tabs[0].url ?? ''
      setIsInJike(url.includes(JIKE_URL))
    })

    getNewLicenseKey().then((result) => {
      console.log('getNewLicenseKey result: ', result)
      if (result) {
        form.setFieldValue('newLicenseKey', result)
      }
    })

    // 获取用户信息
    getUserInfo().then((result: boolean) => {
      console.log('getUserInfo result: ', result)
      setIsVerified(result)
    })
  }, [])

  const handleExport = async () => {
    setIsClickExport(true)

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const activeTab = tabs[0]
      const tid = activeTab.id ?? -1

      if (activeTab && tid > 0) {
        const message: IMessage = {
          type: EXPORT_TYPE,
          isVerified: !!isVerified,
          config: {
            ...exportConfig,
          },
        }
        browser.runtime.sendMessage(message)
      }
    })
  }

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    console.log('Success:', values)
    const result = await storage.setItem(NEW_LICENSE_KEY, values.newLicenseKey)
    console.log('onFinish result: ', result)

    // 更新状态
    setIsVerified(null)
    getUserInfo().then((result: boolean) => {
      setIsVerified(result)
    })
  }

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (
    errorInfo
  ) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        autoComplete="off"
      >
        <Form.Item>
          {inJike ? (
            <Button type="primary" className="button" onClick={handleExport}>
              {isClickExport ? '导出中请耐心等待，完成后自动下载...' : '导出'}
            </Button>
          ) : (
            <Button
              type="primary"
              className="button"
              onClick={() =>
                browser.tabs.create({ url: 'https://web.okjike.com/' })
              }
            >
              去即刻中操作
            </Button>
          )}
        </Form.Item>

        <Form.Item>
          <Checkbox
            disabled={!inJike}
            checked={exportConfig.isSingleFile}
            onChange={(e) =>
              setExportConfig({
                ...exportConfig,
                isSingleFile: e.target.checked,
              })
            }
          >
            导出为单文件
          </Checkbox>
        </Form.Item>
      </Form>

      <Divider />

      <span>
        {isVerified
          ? '您已激活，支持导出全部动态'
          : '未激活仅支持导出 50 条即刻动态'}
      </span>
      <p className="read-the-docs">
        <Form
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            name="newLicenseKey"
            rules={[{ required: true, message: '请输入激活码!' }]}
          >
            <Input
              placeholder="请输入激活码"
              suffix={isVerified === null ? '⌛' : isVerified ? '✅' : '❌'}
            />
          </Form.Item>

          <Form.Item wrapperCol={{ span: 24 }}>
            <Button type="default" htmlType="submit" className="button">
              激活
            </Button>
          </Form.Item>
          <Form.Item wrapperCol={{ span: 24 }}>
            <Button
              type="link"
              htmlType="submit"
              className="button"
              onClick={() =>
                window.open(
                  'https://jike-export.lemonsqueezy.com/buy/702040dd-c006-464e-9cf3-2e200380d228' // 正式地址
                )
              }
            >
              获取激活码
            </Button>
          </Form.Item>
        </Form>
      </p>
    </>
  )
}
