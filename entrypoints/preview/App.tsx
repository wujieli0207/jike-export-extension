import React, { useEffect, useState } from 'react'
import {
  Layout,
  Menu,
  Modal,
  Spin,
  Typography,
  Empty,
  Image as AntImage,
  Avatar,
  Input,
  message,
  Dropdown,
} from 'antd'
import 'antd/dist/reset.css' // Import Ant Design styles
import type { IMemoResult, IExportConfig } from '../popup/types' // Adjust path as necessary
import MemoCard from './components/MemoCard'
import jikeLogo from '~/assets/jike.png'
import Markdown from './components/markdown'
import { formatMdTime } from '@/entrypoints/popup/utils/exportHelper'
import { handleExportFile } from '@/entrypoints/popup/utils/exportFile'
import { contentParse } from '@/entrypoints/popup/utils/parse'
import {
  ExportTypeEnum,
  ExportTypeList,
} from '@/entrypoints/popup/const/exportConst'
import { getLocalExportConfig } from '../popup/utils/user'
import dayjs from 'dayjs'
import { defaultExportConfig } from '../popup/App'
import { DownOutlined } from '@ant-design/icons'

const { Sider, Content } = Layout
const { Title } = Typography
const { Search } = Input

interface PreviewData {
  memoList: IMemoResult[]
  authorInfo: string
  timestamp: number
}

export default function App() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [visibleMemo, setVisibleMemo] = useState<IMemoResult | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  const [exportConfig, setExportConfig] =
    useState<IExportConfig>(defaultExportConfig)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await browser.storage.local.get('previewData')
        console.log('result: ', result)
        if (result.previewData) {
          setPreviewData(result.previewData as PreviewData)
          // Optional: Clear data from storage after fetching
          // await browser.storage.local.remove('previewData');
        } else {
          setError('No preview data found.')
        }
      } catch (e) {
        console.error('Error fetching preview data:', e)
        setError('Failed to load preview data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // 从 localstorage 加载上一次导出的配置信息
    getLocalExportConfig().then((result) => {
      if (result) {
        const { startDate, endDate, moreFilter } = result
        setExportConfig({
          ...defaultExportConfig,
          ...result,
          startDate: startDate ? dayjs(startDate) : null,
          endDate: endDate ? dayjs(endDate) : null,
          moreFilter: moreFilter ? moreFilter : null,
        })
      }
    })
  }, [])

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key)
    setSearchQuery('')
  }

  const handleCardClick = (memo: IMemoResult) => {
    setVisibleMemo(memo)
    setIsModalVisible(true)
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setVisibleMemo(null)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value.trim())
  }

  // Handle export functionality
  const handleExport = async ({
    fileType,
  }: {
    fileType: IExportConfig['fileType']
  }) => {
    if (!previewData || !previewData.memoList.length) {
      message.error('没有数据可导出')
      return
    }

    try {
      setExporting(true)

      // Get the memoList and apply any current filters
      let memosToExport = searchFilteredMemos

      const config = {
        ...exportConfig,
        fileType,
      }

      // Apply content parsing
      const parsedMemos = contentParse(memosToExport, config)

      // Export the file
      handleExportFile(parsedMemos, previewData.authorInfo, config)
    } catch (error) {
      console.error('Export error:', error)
      message.error(
        '导出失败: ' + (error instanceof Error ? error.message : String(error))
      )
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="Loading preview..." />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Empty description={error} />
      </div>
    )
  }

  if (!previewData || previewData.memoList.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Empty description="No memos to display." />
      </div>
    )
  }

  const { memoList, authorInfo } = previewData

  const ALL_CATEGORY_KEY = '__ALL__'
  const UNCLASSIFIED_KEY = '__UNCLASSIFIED__'

  // Calculate categories and their counts based on memoCircle.title
  const categoryCounts: { [key: string]: number } = {}
  memoList.forEach((memo) => {
    const categoryName = memo.memoCircle?.title?.trim()
    if (categoryName && categoryName !== '') {
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
    } else {
      categoryCounts[UNCLASSIFIED_KEY] =
        (categoryCounts[UNCLASSIFIED_KEY] || 0) + 1
    }
  })

  let sidebarMenuItems = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      key: name,
      label: `${name === UNCLASSIFIED_KEY ? '未分类' : name} (${count})`,
    }))
    .sort((a, b) => {
      if (a.key === UNCLASSIFIED_KEY) return 1 // Push Unclassified to the end before sorting
      if (b.key === UNCLASSIFIED_KEY) return -1
      return a.label.localeCompare(b.label) // Sort others alphabetically
    })

  // Add "All" category to the beginning
  sidebarMenuItems.unshift({
    key: ALL_CATEGORY_KEY,
    label: `全部 (${memoList.length})`,
  })

  const filteredMemos =
    selectedCategory === ALL_CATEGORY_KEY
      ? memoList
      : selectedCategory
      ? memoList.filter((memo) => {
          const memoCategoryName = memo.memoCircle?.title?.trim()
          if (selectedCategory === UNCLASSIFIED_KEY) {
            return !memoCategoryName || memoCategoryName === ''
          }
          return memoCategoryName === selectedCategory
        })
      : memoList // Should be handled by default selection

  // Apply search filter on top of category filter
  const searchFilteredMemos = searchQuery
    ? filteredMemos.filter((memo) => {
        const content = (memo.content || memo.rawContent || '').toLowerCase()
        const circleTitle = memo.memoCircle?.title?.toLowerCase() || ''
        const contentCircleTitle =
          memo.contentCircle?.title?.toLowerCase() || ''
        return (
          content.includes(searchQuery.toLowerCase()) ||
          circleTitle.includes(searchQuery.toLowerCase()) ||
          contentCircleTitle.includes(searchQuery.toLowerCase())
        )
      })
    : filteredMemos

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            marginBottom: '12px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Avatar shape="square" src={jikeLogo} />
          <Title style={{ marginBottom: '0px', marginLeft: '10px' }} level={4}>
            {authorInfo}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedCategory ? [selectedCategory] : []}
          onClick={({ key }) => handleCategorySelect(key)}
          items={sidebarMenuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: 250 }}>
        {' '}
        {/* Add margin to main layout to accommodate fixed sider */}
        <Content style={{ padding: '24px', margin: 0, minHeight: 280 }}>
          <div
            style={{
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div style={{ width: '300px' }}>
              <Search
                placeholder="搜索区域"
                allowClear
                onSearch={handleSearch}
              />
            </div>
            <Dropdown.Button
              type="primary"
              loading={exporting}
              onClick={() => {
                handleExport({ fileType: exportConfig.fileType })
              }}
              icon={<DownOutlined />}
              menu={{
                items: ExportTypeList.map((item) => ({
                  key: item.value,
                  label: item.label,
                })),
                onClick: ({ key }) => {
                  handleExport({ fileType: key as ExportTypeEnum })
                },
              }}
            >
              导出
            </Dropdown.Button>
          </div>
          {memoList.length > 0 ? (
            searchFilteredMemos.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {searchFilteredMemos.map((memo, index) => (
                  <MemoCard
                    key={memo.memoLink || index}
                    memo={memo}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
            ) : (
              <Empty
                description={
                  searchQuery
                    ? `未找到与 "${searchQuery}" 相关的动态`
                    : selectedCategory
                    ? `"${
                        sidebarMenuItems.find(
                          (item) => item.key === selectedCategory
                        )?.label || selectedCategory
                      }" 分类下没有动态`
                    : '没有动态'
                }
              />
            )
          ) : (
            <Empty description={'没有获取到动态数据，请检查导出或刷新页面'} />
          )}
        </Content>
      </Layout>
      <Modal
        title={
          visibleMemo?.memoCircle?.title ||
          visibleMemo?.contentCircle?.title ||
          '未分类动态'
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        styles={{
          header: {
            textAlign: 'center',
          },
        }}
      >
        {visibleMemo && (
          <div style={{ marginTop: '32px' }}>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              <Markdown
                content={(
                  visibleMemo.content || visibleMemo.rawContent
                ).replace(/!\[.*?\]\(.*?\)/g, '')}
              />
            </Typography.Paragraph>
            {visibleMemo.files && visibleMemo.files.length > 0 && (
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <AntImage.PreviewGroup
                  preview={{
                    onChange: (current, prev) =>
                      console.log(
                        `current index: ${current}, prev index: ${prev}`
                      ),
                  }}
                >
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}
                  >
                    {visibleMemo.files.map((file, idx) => (
                      <AntImage
                        key={idx}
                        width={100}
                        src={file}
                        alt={`media_${idx}`}
                        style={{
                          borderRadius: '4px',
                          objectFit: 'cover',
                          height: '100px',
                        }}
                      />
                    ))}
                  </div>
                </AntImage.PreviewGroup>
              </div>
            )}

            <Typography.Text type="secondary">
              {formatMdTime(visibleMemo?.time)}
            </Typography.Text>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
