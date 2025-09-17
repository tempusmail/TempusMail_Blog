import * as React from 'react'

interface CommentsProps {
  repo: string
  issueTerm?: string
  label?: string
  theme?: string
}

// Lightweight Utterances wrapper that injects the script when mounted
export function Comments({ repo, issueTerm = 'pathname', label, theme = 'github-light' }: CommentsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!repo) return
    const container = containerRef.current
    if (!container) return

    // Avoid duplicating the iframe if it already exists
    if (container.querySelector('iframe.utterances-frame')) return

    const script = document.createElement('script')
    script.src = 'https://utteranc.es/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    // Use the provided repo in the required "owner/repo" format
    script.setAttribute('repo', repo)
    script.setAttribute('issue-term', issueTerm)
    script.setAttribute('theme', theme)
    if (label) script.setAttribute('label', label)

    container.append(script)

    return () => {
      // Cleanup on unmount
      while (container.firstChild) {
        container.firstChild.remove()
      }
    }
  }, [repo, issueTerm, label, theme])

  return <div className='comments' ref={containerRef} />
}