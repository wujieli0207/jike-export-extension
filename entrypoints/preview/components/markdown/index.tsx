import './markdown.css'

import MarkdownIt from 'markdown-it'

export default function Markdown({ content }: { content: string }) {
  const md: MarkdownIt = new MarkdownIt({
    linkify: true,
  })

  // Get the default renderer for links
  const defaultRender =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // Add target="_blank" and rel="noopener noreferrer" to all links
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')

    // Call the default renderer
    return defaultRender(tokens, idx, options, env, self)
  }

  const renderedMarkdown = md.render(content)

  return (
    <div
      className="max-w-full overflow-x-auto markdown"
      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
    />
  )
}
