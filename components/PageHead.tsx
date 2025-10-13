import Head from 'next/head'
import { getPageProperty } from 'notion-utils'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { getSocialImageUrl } from '@/lib/get-social-image-url'

// Helper function to extract and parse ImageURLs from Notion rich_text property
function getImageUrls(
  block: types.Block,
  recordMap: types.ExtendedRecordMap
): string[] {
  try {
    const imageUrlsText = getPageProperty<string>('ImageURLs', block, recordMap)
    if (!imageUrlsText) {
      return []
    }
    
    // Split by comma and clean up each URL
    const urls = imageUrlsText
      .split(',')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'))
    
    return urls
  } catch (err) {
    console.warn('Error extracting ImageURLs:', err)
    return []
  }
}

export function PageHead({
  site,
  title,
  description,
  pageId,
  image,
  url,
  isBlogPost,
  recordMap,
  block
}: types.PageProps & {
  title?: string
  description?: string
  image?: string
  url?: string
  isBlogPost?: boolean
  block?: types.Block
}) {
  const rssFeedUrl = `${config.host}/feed`

  title = title ?? site?.name
  description = description ?? site?.description

  const socialImageUrl = getSocialImageUrl(pageId) || image

  // Extract image URLs from the ImageURLs property
  const imageUrls = block && recordMap ? getImageUrls(block, recordMap) : []
  
  // Create the image array for schema - use ImageURLs if available, otherwise fallback to socialImageUrl
  const schemaImages = imageUrls.length > 0 ? imageUrls : (socialImageUrl ? [socialImageUrl] : undefined)

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
      />

      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='black' />

      <meta
        name='theme-color'
        media='(prefers-color-scheme: light)'
        content='#fefffe'
        key='theme-color-light'
      />
      <meta
        name='theme-color'
        media='(prefers-color-scheme: dark)'
        content='#2d3439'
        key='theme-color-dark'
      />

      <meta name='robots' content='index,follow' />
      <meta property='og:type' content='website' />

      {site && (
        <>
          <meta property='og:site_name' content={site.name} />
          <meta property='twitter:domain' content={site.domain} />
        </>
      )}

      {config.twitter && (
        <meta name='twitter:creator' content={`@${config.twitter}`} />
      )}

      {description && (
        <>
          <meta name='description' content={description} />
          <meta property='og:description' content={description} />
          <meta name='twitter:description' content={description} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta property='og:image' content={socialImageUrl} />
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {url && (
        <>
          <link rel='canonical' href={url} />
          <meta property='og:url' content={url} />
          <meta property='twitter:url' content={url} />
        </>
      )}

      <link
        rel='alternate'
        type='application/rss+xml'
        href={rssFeedUrl}
        title={site?.name}
      />

      <meta property='og:title' content={title} />
      <meta name='twitter:title' content={title} />
      <title>{title}</title>

      {/* Better SEO for the blog posts */}
      {isBlogPost && (
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': url
            },
            headline: title,
            name: title,
            description,
            ...(schemaImages && { image: schemaImages }),
            author: {
              '@type': 'Person',
              name: config.author
            },
            publisher: {
              '@type': 'Organization',
              name: 'TempusMail',
              logo: {
                '@type': 'ImageObject',
                url: 'https://tempusmail.com/TempusMail.svg'
              }
            },
            datePublished: '2025-10-02',
            dateModified: '2025-10-09'
          })}
        </script>
      )}
    </Head>
  )
}
