import './App.css'
import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { storage } from 'wxt/storage'
import {
  Button,
  Card,
  Checkbox,
  Divider,
  Flex,
  Form,
  FormProps,
  Input,
  Select,
  Tooltip,
} from 'antd'
import { EXPORT_CONFIG, EXPORT_TYPE, JIKE_URL, NEW_LICENSE_KEY } from './config'
import {
  getLocalExportConfig,
  getNewLicenseKey,
  getUserInfo,
} from './utils/user'
import { IExportConfig, IMessage } from './types'
import { EXPORT_TIPS } from './config'
import {
  ContentOrderTypeEnum,
  ContentOrderTypeList,
  ExportTypeEnum,
  ExportTypeList,
} from './const/exportConst'
import { RightOutlined } from '@ant-design/icons'

type FieldType = {
  newLicenseKey?: string
}

const defaultExportConfig: IExportConfig = {
  fileType: ExportTypeEnum.MD,
  isSingleFile: false,
  isDownloadImage: false,
  contentOrder: ContentOrderTypeEnum.DESC,
}

export default function App() {
  const [form] = Form.useForm()

  const [isClickExport, setIsClickExport] = useState(false)
  const [inJike, setIsInJike] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(false)

  const [exportConfig, setExportConfig] =
    useState<IExportConfig>(defaultExportConfig)
  const [showOptions, setShowOptions] = useState({
    isShowImage: false,
    isShowSingleFile: false,
    isShowContentOrder: false,
  })
  const [isExpandVerified, setIsExpandVerified] = useState(false)

  useEffect(() => {
    // 判断是不是在即刻中
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const url = tabs[0].url ?? ''
      setIsInJike(url.includes(JIKE_URL))
    })

    getNewLicenseKey().then((result) => {
      if (result) {
        form.setFieldValue('newLicenseKey', result)
      }
    })

    // 获取用户信息
    getUserInfo().then((result: boolean) => {
      setIsVerified(result)
      // 未激活状态，展示激活信息
      setIsExpandVerified(!result)
    })

    // 从 localstorage 加载上一次导出的配置信息
    getLocalExportConfig().then((result) => {
      if (result) {
        setExportConfig({
          ...defaultExportConfig,
          ...result,
        })
        handleSetShowOptions(result.fileType, result.isSingleFile)
      }
    })
  }, [])

  const handleExport = async () => {
    setIsClickExport(true)

    // 存储当前当初选项至 localstorage 中
    await storage.setItem(EXPORT_CONFIG, JSON.stringify(exportConfig))

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
    await storage.setItem(NEW_LICENSE_KEY, values.newLicenseKey)

    // 更新状态
    setIsVerified(null)
    getUserInfo().then((result: boolean) => {
      setIsVerified(result)
    })
  }

  const handleSetShowOptions = (
    fileType: ExportTypeEnum,
    isSingleFile: boolean
  ) => {
    setShowOptions({
      ...showOptions,
      // 包含以下的类型不展示是否导出图片
      isShowImage: ![
        ExportTypeEnum.TXT,
        ExportTypeEnum.EXCEL,
        ExportTypeEnum.CSV,
      ].includes(fileType),
      // 包含以下的类型不展示是否导出单文件
      isShowSingleFile: ![ExportTypeEnum.EXCEL, ExportTypeEnum.CSV].includes(
        fileType
      ),
      // 两种情况
      // 1. 肯定导出的是单文件，比如 excel、csv
      // 2. 选择导出的是单文件
      isShowContentOrder:
        [ExportTypeEnum.EXCEL, ExportTypeEnum.CSV].includes(fileType) ||
        isSingleFile,
    })
  }

  return (
    <>
      <Form
        name="basic"
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        autoComplete="off"
        labelAlign="left"
      >
        <Form.Item>
          {inJike ? (
            <Button type="primary" className="button" onClick={handleExport}>
              {isClickExport ? EXPORT_TIPS : '导出'}
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

        <Card title="导出设置" size="small">
          <Form.Item style={{ marginBottom: '8px' }}>
            <Flex justify="space-between" align="center">
              <span style={{ width: '90px', marginRight: '12px' }}>
                文件类型:{' '}
              </span>
              <Select
                size="small"
                value={exportConfig.fileType}
                disabled={!inJike}
                options={ExportTypeList}
                onChange={(value) => {
                  setExportConfig({
                    ...exportConfig,
                    fileType: value,
                  })
                  handleSetShowOptions(value, exportConfig.isSingleFile)
                }}
              />
            </Flex>
          </Form.Item>

          <Flex justify="space-between">
            {showOptions.isShowSingleFile && (
              <Form.Item style={{ marginBottom: '0px' }}>
                <Tooltip
                  placement="top"
                  title="勾选后将导出为单个文件，不勾选则根据动态时间导出为多个文件"
                >
                  <Checkbox
                    disabled={!inJike}
                    checked={exportConfig.isSingleFile}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setExportConfig({
                        ...exportConfig,
                        isSingleFile: checked,
                      })
                      handleSetShowOptions(exportConfig.fileType, checked)
                    }}
                  >
                    导出为单文件
                  </Checkbox>
                </Tooltip>
              </Form.Item>
            )}

            {showOptions.isShowImage && (
              <Form.Item style={{ marginBottom: '0px' }}>
                <Tooltip placement="top" title="勾选后将单独下载动态中的图片">
                  <Checkbox
                    disabled={!inJike}
                    checked={exportConfig.isDownloadImage}
                    onChange={(e) =>
                      setExportConfig({
                        ...exportConfig,
                        isDownloadImage: e.target.checked,
                      })
                    }
                  >
                    单独导出图片
                  </Checkbox>
                </Tooltip>
              </Form.Item>
            )}
          </Flex>

          {exportConfig.isSingleFile && (
            <Form.Item style={{ marginBottom: '8px' }}>
              <Flex justify="space-between" align="center">
                <span style={{ width: '90px', marginRight: '12px' }}>
                  排序:{' '}
                </span>
                <Select
                  size="small"
                  value={exportConfig.contentOrder}
                  disabled={!inJike}
                  options={ContentOrderTypeList}
                  onChange={(value) => {
                    setExportConfig({
                      ...exportConfig,
                      contentOrder: value,
                    })
                  }}
                />
              </Flex>
            </Form.Item>
          )}
        </Card>
      </Form>

      <Divider />

      <span
        onClick={() => setIsExpandVerified(!isExpandVerified)}
        className="verified-header"
      >
        <RightOutlined
          style={{
            marginRight: '4px',
            fontSize: '10px',
            transform: isExpandVerified ? 'rotate(90deg)' : '',
          }}
        />
        {isVerified
          ? '您已激活，支持导出全部动态'
          : '未激活仅支持导出 50 条即刻动态'}
      </span>
      <div
        className={`verified-content ${
          isExpandVerified ? 'expanded' : 'collapsed'
        }`}
      >
        <p>
          <Form
            form={form}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
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
      </div>
    </>
  )
}
