import { IMemoResult } from '@/entrypoints/popup/types'
import { Image, Modal, Typography } from 'antd'
import Markdown from './markdown'
import { formatMdTime } from '@/entrypoints/popup/utils/exportHelper'

export default function CardModal({
  memo,
  isModalVisible,
  handleModalClose,
}: {
  memo: IMemoResult | null
  isModalVisible: boolean
  handleModalClose: () => void
}) {
  return (
    <Modal
      title={
        memo?.memoCircle?.title || memo?.contentCircle?.title || '未分类动态'
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
      {memo && (
        <div style={{ marginTop: '32px' }}>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            <Markdown
              content={(memo.content || memo.rawContent).replace(
                /!\[.*?\]\(.*?\)/g,
                ''
              )}
            />
          </Typography.Paragraph>
          {memo.files && memo.files.length > 0 && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <Image.PreviewGroup
                preview={{
                  onChange: (current, prev) =>
                    console.log(
                      `current index: ${current}, prev index: ${prev}`
                    ),
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {memo.files.map((file, idx) => (
                    <Image
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
              </Image.PreviewGroup>
            </div>
          )}

          <Typography.Text type="secondary">
            {formatMdTime(memo?.time)}
          </Typography.Text>
        </div>
      )}
    </Modal>
  )
}
