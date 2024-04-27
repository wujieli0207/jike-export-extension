import './App.css'
import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { Button, Checkbox, Divider, Form, FormProps, Input } from 'antd'
import { EXPORT_TYPE, JIKE_URL } from './config'
import { getUserInfo } from './utils'
import { IExportConfig } from './types'

type FieldType = {
  activateCode?: string
}

export default function App() {
  const [isClickExport, setIsClickExport] = useState(false)
  const [inJike, setIsInJike] = useState(false)

  const [exportConfig, setExportConfig] = useState<IExportConfig>({
    isSingleFile: false,
  })

  useEffect(() => {
    // 判断是不是在即刻中
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const url = tabs[0].url ?? ''
      setIsInJike(url.includes(JIKE_URL))
    })

    // 获取用户信息
    getUserInfo()
  }, [])

  const handleExport = async () => {
    setIsClickExport(true)

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const activeTab = tabs[0]
      const tid = activeTab.id ?? -1

      if (activeTab && tid > 0) {
        browser.runtime.sendMessage({
          type: EXPORT_TYPE,
          config: {
            ...exportConfig,
          },
        })
      }
    })
  }

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    console.log('Success:', values)
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
        <Form.Item<FieldType>
          name="activateCode"
          rules={[{ required: true, message: '请输入激活码!' }]}
        >
          {inJike ? (
            <Button type="primary" className="button" onClick={handleExport}>
              {isClickExport ? '导出中，完成后将自动下载...' : '导出'}
            </Button>
          ) : (
            <Button
              type="primary"
              className="button"
              onClick={() =>
                browser.tabs.create({ url: 'https://web.okjike.com/' })
              }
            >
              去即刻动态中操作
            </Button>
          )}
        </Form.Item>

        <Form.Item>
          <Checkbox
            value={exportConfig.isSingleFile}
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

      <span>未激活仅支持导出 50 条即刻动态</span>
      <p className="read-the-docs">
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            name="activateCode"
            rules={[{ required: true, message: '请输入激活码!' }]}
          >
            <Input placeholder="请输入激活码" />
          </Form.Item>

          <Form.Item wrapperCol={{ span: 24 }}>
            <Button
              disabled={true}
              type="default"
              htmlType="submit"
              className="button"
            >
              激活（coming soon）
            </Button>
          </Form.Item>
          <Form.Item wrapperCol={{ span: 24 }}>
            <Button
              disabled={true}
              type="link"
              htmlType="submit"
              className="button"
            >
              获取激活码（coming soon）
            </Button>
          </Form.Item>
        </Form>
      </p>
    </>
  )
}
