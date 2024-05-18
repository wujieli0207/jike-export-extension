import { Spin } from 'antd'

const Loading = ({ tip = 'Loading' }: { tip?: string }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Spin size="large" />
      <div style={{ marginTop: '8px' }}>{tip}</div>
    </div>
  )
}

export default Loading
