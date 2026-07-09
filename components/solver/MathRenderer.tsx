'use client'
import katex from 'katex'

interface Props {
  text: string
  className?: string
  block?: boolean  // if true, renders as display math ($$)
}

function renderLatex(source: string, display: boolean): string {
  try {
    return katex.renderToString(source, {
      displayMode: display,
      throwOnError: false,
      trust: false,
      strict: false,
    })
  } catch {
    return source
  }
}

// Split text by $$...$$ (display) and $...$ (inline) math
function parseMath(text: string): Array<{ type: 'text' | 'display' | 'inline'; content: string }> {
  const parts: Array<{ type: 'text' | 'display' | 'inline'; content: string }> = []
  // Match $$ first (display), then $ (inline)
  const re = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'text', content: text.slice(last, m.index) })
    }
    const match = m[0]
    if (match.startsWith('$$')) {
      parts.push({ type: 'display', content: match.slice(2, -2).trim() })
    } else {
      parts.push({ type: 'inline', content: match.slice(1, -1).trim() })
    }
    last = m.index + match.length
  }

  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }

  return parts
}

export function MathRenderer({ text, className, block = false }: Props) {
  // If block=true, render the whole text as display LaTeX
  if (block) {
    const html = renderLatex(text, true)
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  const parts = parseMath(text)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>
        }
        const html = renderLatex(part.content, part.type === 'display')
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: html }}
            className={part.type === 'display' ? 'block my-2 overflow-x-auto' : 'mx-0.5'}
          />
        )
      })}
    </span>
  )
}
