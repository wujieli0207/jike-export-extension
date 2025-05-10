import React from 'react'
import { Card, Typography, Image, Tag, Avatar, Space } from 'antd'
import type { IMemoResult, ILink } from '../../popup/types' // Adjust path as necessary
import { formatMdTime } from '@/entrypoints/popup/utils/exportHelper'

const { Paragraph, Text, Link: AntLink } = Typography

interface MemoCardProps {
  memo: IMemoResult
  onCardClick: (memo: IMemoResult) => void
}

const MemoCard: React.FC<MemoCardProps> = ({ memo, onCardClick }) => {
  const hasVisualContent = memo.files.length > 0 || memo.contentCircle?.url
  const mainImage = memo.files.length > 0 ? memo.files[0] : undefined

  return (
    <Card
      hoverable
      styles={{ body: { height: '100%' } }}
      cover={
        mainImage && (
          <div
            style={{
              maxHeight: '200px',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#f0f0f0',
              borderRadius: '8px 8px 0 0',
            }}
          >
            <Image
              alt={memo.contentCircle?.title || 'Memo image'}
              src={mainImage}
              preview={false}
            />
          </div>
        )
      }
      onClick={() => onCardClick(memo)}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: mainImage ? 'flex-start' : 'space-between',
          height: '100%',
        }}
      >
        <div>
          <Card.Meta
            description={
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatMdTime(memo.time)}
              </Text>
            }
            style={{
              marginTop: mainImage ? '12px' : '0',
              marginBottom: '12px',
            }}
          />

          <Paragraph
            ellipsis={{ rows: 6, expandable: false }}
            style={{ marginBottom: '12px' }}
          >
            {memo.rawContent}
          </Paragraph>
        </div>

        <div>
          <Space size={[0, 8]} wrap style={{ marginBottom: '8px' }}>
            {memo.memoCircle && (
              <Tag color="blue">#{memo.memoCircle.title}</Tag>
            )}
            {memo.contentCircle &&
              memo.contentCircle.title !== memo.memoCircle?.title && (
                <Tag color="cyan">{memo.contentCircle.title}</Tag>
              )}
          </Space>

          {/* Minimal display of other files, e.g., count or small icons */}
          {memo.files.length > 1 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              (+{memo.files.length - 1} more image
              {memo.files.length - 1 > 1 ? 's' : ''})
            </Text>
          )}
        </div>
      </div>
    </Card>
  )
}

export default MemoCard
