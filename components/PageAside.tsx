import { type Block, type ExtendedRecordMap } from 'notion-types'
import * as React from 'react'

import { getPageTweet } from '@/lib/get-page-tweet'

import { PageActions } from './PageActions'
// import styles from './styles.module.css'

export function PageAside({
  block,
  recordMap,
  isBlogPost
}: {
  block: Block
  recordMap: ExtendedRecordMap
  isBlogPost: boolean
}) {
  if (!block) {
    return null
  }

  // only display comments and page actions on blog post pages
  if (isBlogPost) {
    const tweet = getPageTweet(block, recordMap)
    if (!tweet) {
      return null
    }

    return <PageActions tweet={tweet} />
  }

  // hide floating social icons on non-blog pages
  return null
}
