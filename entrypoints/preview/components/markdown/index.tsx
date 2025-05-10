import './markdown.css'

import MarkdownIt from 'markdown-it'

export default function Markdown({ content }: { content: string }) {
  const md: MarkdownIt = new MarkdownIt({})

  const renderedMarkdown = md.render(content)

  return (
    <div
      className="max-w-full overflow-x-auto markdown"
      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
    />
  )
}
