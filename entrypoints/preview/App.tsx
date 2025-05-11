import { useEffect, useState, useCallback } from 'react'
import {
  Layout,
  Menu,
  Spin,
  Typography,
  Empty,
  Avatar,
  Input,
  message,
  Dropdown,
} from 'antd'
import 'antd/dist/reset.css' // Import Ant Design styles
import type { IMemoResult, IExportConfig } from '../popup/types' // Adjust path as necessary
import MemoCard from './components/MemoCard'
import jikeLogo from '~/assets/jike.png'
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
import { MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import InfiniteScroll from 'react-photo-album/scroll'
import CardModal from './components/CardModal'

const { Sider, Content } = Layout
const { Title } = Typography
const { Search } = Input

interface PreviewData {
  memoList: IMemoResult[]
  authorInfo: string
  timestamp: number
}

// Type definition for the photo-album item structure
interface MemoPhoto {
  src: string
  width: number
  height: number
  memo: IMemoResult
  key: string
}

const BATCH_SIZE = 20

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

  // Convert memos to the format needed by react-photo-album
  const memoToPhotoFormat = useCallback((memos: IMemoResult[]): MemoPhoto[] => {
    return memos.map((memo, index) => {
      // Default dimensions for memos without images
      let width = 300
      let height = 250
      let src = ''

      // If memo has images, use the first one
      if (memo.files && memo.files.length > 0) {
        src = memo.files[0]
        // Preset dimensions for image cards - can be adjusted for better layout
        width = 300
        height = 300
      }

      return {
        src,
        width,
        height,
        memo,
        key: memo.memoLink || `memo-${index}`,
      }
    })
  }, [])

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

  // Convert filtered memos to photo format for react-photo-album
  const photoAlbumImages = memoToPhotoFormat(searchFilteredMemos)

  // Fetch function for InfiniteScroll
  const fetchPhotos = async (index: number): Promise<MemoPhoto[] | null> => {
    const startIndex = index * BATCH_SIZE
    const totalPhotos = photoAlbumImages.length

    // If the calculated start index is at or beyond the total number of photos,
    // it means all photos have been loaded.
    if (startIndex >= totalPhotos) {
      return null
    }

    // Determine the end index for the slice for the current batch.
    // This ensures we don't try to slice beyond the bounds of the photoAlbumImages array.
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalPhotos)

    // Slice the array to get the next batch of photos.
    const nextBatch = photoAlbumImages.slice(startIndex, endIndex)

    // Optional: Simulate network delay for testing spinners
    // await new Promise(resolve => setTimeout(resolve, 500));
    return nextBatch
  }

  // Calculate responsive columns based on viewport width
  // This mimics the behavior of the previous grid implementation
  const getColumns = (width: number) => {
    if (width < 600) return 1
    if (width < 900) return 2
    if (width < 1200) return 3
    return 4
  }

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
              <InfiniteScroll
                photos={photoAlbumImages.slice(0, BATCH_SIZE)} // Initial batch
                fetch={fetchPhotos}
                // singleton
                key={`${selectedCategory || 'all'}-${searchQuery}`} // Force re-render on filter change, ensure selectedCategory has a fallback for key
                // loading={
                //   <div style={{ textAlign: 'center', padding: '20px' }}>
                //     <Spin tip="Loading more..." />
                //   </div>
                // }
                // finished={
                //   <div style={{ textAlign: 'center', padding: '20px' }}>
                //     All photos loaded.
                //   </div>
                // }
                // error={
                //   <div
                //     style={{
                //       textAlign: 'center',
                //       padding: '20px',
                //       color: 'red',
                //     }}
                //   >
                //     Error loading more photos.
                //   </div>
                // }
              >
                <MasonryPhotoAlbum
                  photos={[]} // InfiniteScroll will provide photos to this
                  columns={getColumns}
                  render={{
                    photo: ({}, { photo }) => (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: '8px', // Keep internal padding for the card
                          boxSizing: 'border-box',
                        }}
                        onClick={() =>
                          handleCardClick((photo as MemoPhoto).memo)
                        }
                      >
                        <MemoCard
                          memo={(photo as MemoPhoto).memo}
                          onCardClick={handleCardClick}
                        />
                      </div>
                    ),
                  }}
                />
              </InfiniteScroll>
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

      {/* 卡片详情弹窗 */}
      <CardModal
        memo={visibleMemo}
        isModalVisible={isModalVisible}
        handleModalClose={handleModalClose}
      />
    </Layout>
  )
}
