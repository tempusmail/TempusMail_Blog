import cs from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type PageBlock } from 'notion-types'
import { formatDate, getBlockTitle, getPageProperty, getPageTableOfContents } from 'notion-utils'
import * as React from 'react'
import BodyClassName from 'react-body-classname'
import {
  type NotionComponents,
  NotionRenderer,
  useNotionContext
} from 'react-notion-x'
import { Code as NotionCode } from "react-notion-x/build/third-party/code";
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from 'react-tweet'
import { useSearchParam } from 'react-use'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'

// import { Comments } from './Comments'
import { Footer } from './Footer'
import { Loading } from './Loading'
import { Mermaid } from "./Mermaid"; // the component we wrote earlier
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
// import styles from './styles.module.css'

// -----------------------------------------------------------------------------
// dynamic imports for optional components
// -----------------------------------------------------------------------------

const Codes = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    // add / remove any prism syntaxes here
    await Promise.allSettled([
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markup-templating.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markup.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-bash.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-c.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-cpp.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-csharp.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-docker.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-java.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-js-templates.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-coffeescript.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-diff.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-git.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-go.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-graphql.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-handlebars.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-less.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-makefile.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markdown.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-objectivec.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-ocaml.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-python.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-reason.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-rust.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-sass.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-scss.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-solidity.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-sql.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-stylus.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-swift.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-wasm.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-yaml.js')
    ])
    return m.Code
  })
)


const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  )
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(
  () => import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf),
  {
    ssr: false
  }
)
const Modal = dynamic(
  () =>
    import('react-notion-x/build/third-party/modal').then((m) => {
      m.Modal.setAppElement('.notion-viewport')
      return m.Modal
    }),
  {
    ssr: false
  }
)

// const Mermaid = dynamic(
//   () =>
//     import("react-notion-x/build/third-party/mermaid").then((m) => m.Mermaid),
//   { ssr: false }
// )


function Tweet({ id }: { id: string }) {
  const { recordMap } = useNotionContext()
  const tweet = (recordMap as types.ExtendedTweetRecordMap)?.tweets?.[id]

  return (
    <React.Suspense fallback={<TweetSkeleton />}>
      {tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />}
    </React.Suspense>
  )
}

const propertyLastEditedTimeValue = (
  { block, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && block?.last_edited_time) {
    return `Last updated ${formatDate(block?.last_edited_time, {
      month: 'long'
    })}`
  }

  return defaultFn()
}

const propertyDateValue = (
  { data, schema, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'published') {
    const publishDate = data?.[0]?.[1]?.[0]?.[1]?.start_date

    if (publishDate) {
      return `${formatDate(publishDate, {
        month: 'long'
      })}`
    }
  }

  return defaultFn()
}

const propertyTextValue = (
  { schema, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  // Hide ImageURLs property from being displayed as text
  if (schema?.name?.toLowerCase() === 'imageurls') {
    return null
  }

  if (pageHeader && schema?.name?.toLowerCase() === 'author') {
    return <b>{defaultFn()}</b>
  }

  return defaultFn()
}

// Custom component to filter out the first block (gradient banner) on index page
// const CustomBlock = ({ block, level, blockId, ...props }: any) => {
//   const { recordMap } = useNotionContext()
//   const router = useRouter()

//   // Check if this is the index page and if this is the first block
//   const isIndexPage = router.asPath === '/' || router.asPath === ''
//   const blockKeys = Object.keys(recordMap?.block || {})
//   const isFirstBlock = blockId === blockKeys[0]

//   // Debug logging to see what blocks are being rendered
//   if (isIndexPage && isFirstBlock) {
//     console.log('First block on index page:', {
//       block,
//       blockId,
//       blockType: block?.type
//     })
//   }

//   // Hide the first block on index page (the gradient banner)
//   // Also hide callout blocks and any blocks with gradient backgrounds
//   if (
//     isIndexPage &&
//     (isFirstBlock || block?.type === 'callout' || block?.type === 'divider')
//   ) {
//     console.log('Hiding block:', {
//       blockId,
//       blockType: block?.type,
//       isFirstBlock
//     })
//     return null
//   }

//   // Use default block rendering for all other cases
//   const { components } = useNotionContext()
//   const BlockComponent = components.block || 'div'
//   return (
//     <BlockComponent block={block} level={level} blockId={blockId} {...props} />
//   )
// }

// ✅ Corrected CustomBlock
export function CustomBlock({ block, level: _level, blockId, ...props }: any) {
  const { recordMap } = useNotionContext()
  const router = useRouter()

  const isIndexPage = router.asPath === '/' || router.asPath === ''
  const blockKeys = Object.keys(recordMap?.block || {})
  const isFirstBlock = blockId === blockKeys[0]

  if (
    isIndexPage &&
    (isFirstBlock || block?.type === 'callout' || block?.type === 'divider')
  ) {
    return null
  }

  // ✅ Return the children directly since we're filtering blocks, not replacing them
  return <>{props.children}</>
}

function CustomCode({ block, ...props }: any) {
  const language = block.properties?.language?.[0]?.[0];

  if (language === "Mermaid" || language === "mermaid") {
    return <Mermaid block={block} />;
  }

  return <NotionCode block={block} {...props} />;
}

export function NotionPage({
  site,
  recordMap,
  error,
  pageId
}: types.PageProps) {
  const router = useRouter()
  const lite = useSearchParam('lite')

  const components = React.useMemo<Partial<NotionComponents>>(
    () => ({
      nextLegacyImage: Image,
      nextLink: Link,
      Codes,
      Code:CustomCode,
      Collection,
      Equation,
      Pdf,
      Modal,
      Tweet,
      Header: NotionPageHeader,
      propertyLastEditedTimeValue,
      propertyTextValue,
      propertyDateValue,
    }),
    []
  )

  // lite mode is for oembed
  const isLiteMode = lite === 'true'

  const { isDarkMode } = useDarkMode()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [isTocCollapsed, setIsTocCollapsed] = React.useState(false)

  // Prevent hydration mismatch by only applying dark mode after mounting
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleToggleToc = React.useCallback(() => {
    setIsTocCollapsed((prev) => !prev)
  }, [])

  const getHeaderHeight = React.useCallback(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const cssVar = rootStyle.getPropertyValue('--notion-header-height').trim()
    const cssVarPx = cssVar ? Number.parseInt(cssVar, 10) : 0

    const headerMain = document.querySelector('.notion-header') as HTMLElement | null
    const headerNav = document.querySelector('.notion-nav-header') as HTMLElement | null
    const h1 = headerMain?.offsetHeight || 0
    const h2 = headerNav?.offsetHeight || 0
    return Math.max(cssVarPx, h1, h2)
  }, [])

  const handleTocItemClick = React.useCallback((event: React.MouseEvent, id: string) => {
    event.preventDefault()

    const target =
      (document.getElementById(id) as HTMLElement | null) ||
      (document.querySelector(`[data-id="${id}"]`) as HTMLElement | null)

    if (target) {
      const headerHeight = getHeaderHeight()

      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8
      window.scrollTo({ top, behavior: 'smooth' })
      window.history.replaceState(null, '', `#${id}`)
    }
  }, [getHeaderHeight])

  React.useEffect(() => {
    if (config.isServer) return

    const pageEl = document.querySelector('.notion-page')
    if (!pageEl) return

    pageEl.classList.toggle('toc-collapsed', isTocCollapsed)

    return () => {
      pageEl.classList.remove('toc-collapsed')
    }
  }, [isTocCollapsed])

  // Use a safe dark mode value that prevents hydration mismatch
  const safeDarkMode = hasMounted ? isDarkMode : false

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite

    const searchParams = new URLSearchParams(params)
    return site ? mapPageUrl(site, recordMap!, searchParams) : undefined
  }, [site, recordMap, lite])

  const keys = Object.keys(recordMap?.block || {})
  const block = recordMap?.block?.[keys[0]!]?.value

  // const isRootPage =
  //   parsePageId(block?.id) === parsePageId(site?.rootNotionPageId)
  const isBlogPost =
    block?.type === 'page' && block?.parent_table === 'collection'

  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const tableOfContents = React.useMemo(
    () => {
      if (!block || !recordMap) return []
      try {
        return getPageTableOfContents(block as PageBlock, recordMap)
      } catch (err) {
        console.warn('Failed to generate table of contents:', err)
        return []
      }
    },
    [block, recordMap]
  )

  const hasToc = showTableOfContents && tableOfContents.length >= minTableOfContentsItems

  // const pageAside = React.useMemo(
  //   () => (
  //     <PageAside
  //       block={block!}
  //       recordMap={recordMap!}
  //       isBlogPost={isBlogPost}
  //     />
  //   ),
  //   [block, recordMap, isBlogPost]
  // )

  const footer = React.useMemo(() => <Footer />, [])

  // Ensure headings have anchor IDs matching TOC ids for reliable scrolling
  React.useEffect(() => {
    if (!hasToc || config.isServer) return

    const assignIds = () => {
      for (const item of tableOfContents) {
        const id = item.id
        if (!id) continue

        if (document.getElementById(id)) continue

        let el: HTMLElement | null = null

        el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null
        if (!el) {
          el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null
        }

        if (!el) {
          const titleEls = Array.from(
            document.querySelectorAll('.notion-page .notion-h-title')
          ) as HTMLElement[]
          const match = titleEls.find(
            (e) => e.textContent?.trim() === item.text.trim()
          )
          if (match) {
            el = (match.closest('.notion-h, .notion-h1, .notion-h2, .notion-h3') as HTMLElement) || match.parentElement
          }
        }

        if (el) {
          try {
            el.id = id
            // Ensure heading remains visible beneath sticky header
            const headerHeight = getHeaderHeight()
            el.style.scrollMarginTop = `${headerHeight + 12}px`
          } catch {
            // no-op
          }
        }
      }
    }

    // run after NotionRenderer has flushed the DOM
    const t = setTimeout(assignIds, 0)
    return () => clearTimeout(t)
  }, [hasToc, tableOfContents, recordMap, getHeaderHeight])

  // Inject Utterances comments into .notion-page container after render
  React.useEffect(() => {
    if (!isBlogPost || !hasMounted || config.isServer) return

    // Find the .notion-page container
    const notionPage = document.querySelector('.notion-page')
    if (!notionPage) {
      // If not found, try again after a short delay (page might still be rendering)
      const timeout = setTimeout(() => {
        const retryPage = document.querySelector('.notion-page')
        if (retryPage) {
          injectComments(retryPage)
        }
      }, 300)
      return () => clearTimeout(timeout)
    }

    injectComments(notionPage)

    function injectComments(container: Element) {
      // Check if comments are already injected
      if (container.querySelector('.utterances-comments-wrapper')) {
        return
      }

      // Create wrapper for comments
      const commentsWrapper = document.createElement('div')
      commentsWrapper.className = 'utterances-comments-wrapper'

      // Create container div with proper styling classes
      const commentsContainer = document.createElement('div')
      commentsContainer.className = 'comments-container'
      commentsWrapper.append(commentsContainer)

      // Append to notion-page container
      container.append(commentsWrapper)

      // Initialize Utterances
      const repo = config.utterancesRepo || 'transitive-bullshit/nextjs-notion-starter-kit'
      const script = document.createElement('script')
      script.src = 'https://utteranc.es/client.js'
      script.setAttribute('repo', repo)
      script.setAttribute('issue-term', 'pathname')
      script.setAttribute('label', 'comments')
      script.setAttribute('theme', isDarkMode ? 'github-dark' : 'github-light')
      script.setAttribute('crossorigin', 'anonymous')
      script.async = true
      commentsContainer.append(script)
    }

    // Cleanup function to remove comments if component unmounts or page changes
    return () => {
      const notionPage = document.querySelector('.notion-page')
      if (notionPage) {
        const wrapper = notionPage.querySelector('.utterances-comments-wrapper')
        if (wrapper) {
          wrapper.remove()
        }
      }
    }
  }, [isBlogPost, hasMounted, isDarkMode])

  // React Hooks must be called before any early returns
  React.useEffect(() => {
    if (!config.isServer && block) {
      // add important objects to the window global for easy debugging
      const g = window as any
      g.pageId = pageId
      g.recordMap = recordMap
      g.block = block
    }
  }, [pageId, recordMap, block])

  if (router.isFallback) {
    return <Loading />
  }

  if (error || !site || !block) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const title = getBlockTitle(block, recordMap) || site.name

  console.log('notion page', {
    isDev: config.isDev,
    title,
    pageId,
    rootNotionPageId: site.rootNotionPageId,
    recordMap
  })

  const canonicalPageUrl = config.isDev
    ? undefined
    : getCanonicalPageUrl(site, recordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
    (block as PageBlock).format?.page_cover ||
    config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, recordMap) ||
    config.description

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
        isBlogPost={isBlogPost}
        recordMap={recordMap}
        block={block}
      />

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {safeDarkMode && <BodyClassName className='dark-mode' />}

      <NotionRenderer
        bodyClassName={cs(
          'notion',
          pageId === site.rootNotionPageId && 'index-page'
        )}
        darkMode={safeDarkMode}
        components={components}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        rootDomain={site.domain}
        fullPage={!isLiteMode}
        previewImages={!!recordMap.preview_images}
        showCollectionViewDropdown={false}
        showTableOfContents={false}
        minTableOfContentsItems={minTableOfContentsItems}
        defaultPageIcon={config.defaultPageIcon}
        defaultPageCover={config.defaultPageCover}
        defaultPageCoverPosition={config.defaultPageCoverPosition}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapImageUrl}
        searchNotion={config.isSearchEnabled ? searchNotion : undefined}
        // pageAside={pageAside} // Removed, we handle it manually below
        footer={footer}
      />


      {hasToc && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            .notion-page-aside-inline {
              position: fixed !important;
              top: 50%;
              right: 20px;
              transform: translateY(-50%);
              width: 280px;
              max-height: 70vh;
              overflow-y: auto;
              background: rgba(255, 255, 255, 0.85);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border-radius: 12px;
              padding: 1.25rem 0.5rem;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
              z-index: 100;
              border: 1px solid rgba(255, 255, 255, 0.2);
              transition: transform 300ms ease, opacity 300ms ease;
              scrollbar-width: thin;
              scrollbar-color: rgba(0,0,0,0.1) transparent;
              text-align: left !important;
            }

            .notion-toc-toggle-inline {
              position: fixed !important;
              top: 50%;
              right: 16px;
              transform: translateY(-50%);
              width: 40px;
              height: 40px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              border: 1px solid rgba(255, 255, 255, 0.2);
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
              cursor: pointer;
              z-index: 110;
              transition: all 250ms ease;
              color: #444;
            }

            .notion-toc-toggle-inline:hover {
              transform: translateY(-50%) scale(1.05);
              background: rgba(255, 255, 255, 1);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
              color: #000;
            }

            .notion-toc-toggle-inline svg {
              transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .notion-toc-toggle-inline.collapsed svg {
              transform: rotate(180deg);
            }

            .notion-aside-table-of-contents {
              text-align: left !important;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }

            .notion-aside-toc-header-inline {
              font-size: 0.7rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #888;
              margin-bottom: 0.75rem;
              padding-left: 12px;
              text-align: left !important;
              width: 100%;
            }

            .notion-toc-item-inline {
              display: block;
              width: 100%;
              box-sizing: border-box;
              font-size: 13px;
              color: #555;
              text-decoration: none;
              line-height: 1.5;
              padding: 6px 12px;
              margin: 0 0 2px 0 !important; /* Force zero margin */
              border-radius: 6px;
              transition: all 150ms ease;
              cursor: pointer;
              white-space: normal;
              position: relative;
              text-align: left !important; /* Force left alignment */
            }

            .notion-toc-item-inline:hover {
              background: rgba(0, 0, 0, 0.04);
              color: #111;
            }
            
            .notion-toc-item-body-inline {
               display: inline-block;
               text-align: left;
            }

            /* Reset any global indentation styles */
            [class*="notion-table-of-contents-item-indent-level-"] {
              margin-left: 0 !important;
              padding-left: 12px !important; /* Constant padding */
            }

            /* Custom Scrollbar */
            .notion-page-aside-inline::-webkit-scrollbar {
              width: 4px;
            }
            .notion-page-aside-inline::-webkit-scrollbar-track {
              background: transparent;
            }
            .notion-page-aside-inline::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.1);
              border-radius: 8px;
            }
            .notion-page-aside-inline:hover::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.2);
            }

            /* Dark Mode Overrides inline */
            .dark-mode .notion-page-aside-inline {
              background: rgba(30, 30, 30, 0.85);
              border-color: rgba(255, 255, 255, 0.1);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }

            .dark-mode .notion-toc-toggle-inline {
              background: rgba(40, 40, 40, 0.9);
              border-color: rgba(255, 255, 255, 0.1);
              color: #ccc;
            }
            
            .dark-mode .notion-toc-toggle-inline:hover {
               background: rgba(50, 50, 50, 1);
               color: #fff;
            }

            .dark-mode .notion-aside-toc-header-inline {
              color: rgba(255, 255, 255, 0.5);
            }

            .dark-mode .notion-toc-item-inline {
              color: rgba(255, 255, 255, 0.7);
            }

            .dark-mode .notion-toc-item-inline:hover {
              background: rgba(255, 255, 255, 0.08);
              color: rgba(255, 255, 255, 1);
            }
            
            .dark-mode .notion-page-aside-inline::-webkit-scrollbar-thumb {
               background: rgba(255,255,255,0.2);
            }

            @media (max-width: 1024px) {
              .notion-toc-toggle-inline {
                top: auto !important;
                bottom: 24px;
                right: 20px;
                transform: none;
              }
              body:not(.toc-collapsed) .notion-toc-toggle-inline {
                right: 20px;
              }
              .notion-page-aside-inline {
                top: auto;
                bottom: 80px;
                right: 20px;
                transform: none;
                width: min(320px, calc(100vw - 40px));
                max-height: 55vh;
              }
            }
          `}} />

          <button
            type='button'
            className={cs('notion-toc-toggle-inline', isTocCollapsed && 'collapsed')}
            style={{ right: isTocCollapsed ? '20px' : '310px' }}
            aria-label={isTocCollapsed ? 'Show table of contents' : 'Hide table of contents'}
            aria-pressed={!isTocCollapsed}
            title='Table of Contents'
            onClick={handleToggleToc}
          >
            <svg
              aria-hidden='true'
              focusable='false'
              viewBox='0 0 24 24'
              width='20'
              height='20'
            >
              <path
                d='M10 6l6 6-6 6'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>

          {!isTocCollapsed && (
            <aside className='notion-page-aside-inline'>
              <div className='notion-aside-table-of-contents'>
                <div className='notion-aside-toc-header-inline'>Table of Contents</div>
                {tableOfContents.map((tocItem) => (
                  <a
                    key={tocItem.id}
                    href={`#${tocItem.id}`}
                    onClick={(event) => handleTocItemClick(event, tocItem.id)}
                    className={cs(
                      'notion-toc-item-inline',
                      `notion-table-of-contents-item-indent-level-${tocItem.indentLevel}`
                    )}
                  >
                    <span className='notion-toc-item-body-inline'>
                      {tocItem.text}
                    </span>
                  </a>
                ))}
              </div>
              <PageAside
                block={block!}
                recordMap={recordMap!}
                isBlogPost={isBlogPost}
              />
            </aside>
          )}
        </>
      )}
    </>
  )
}
