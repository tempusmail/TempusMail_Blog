import type { SearchParameters } from '@notionhq/client/build/src/api-endpoints'
import { Client } from '@notionhq/client'

import type * as types from './types'

// Initialize the official Notion client with integration token
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export async function searchWithIntegration(
  params: types.SearchParams
): Promise<types.SearchResults> {
  try {
    // Convert our search params to official API format
    const searchParams: SearchParameters = {
      query: params.query,
      page_size: 100,
      ...(params.ancestorId && {
        filter: {
          value: 'page',
          property: 'object'
        }
      })
    }

    // Use the official Notion API search
    const response = await notion.search(searchParams)

    // Get unique pages only (remove duplicates by ID)
    const uniquePages = response.results.filter((item: any, index: number, self: any[]) => {
      return item.object === 'page' && 
             self.findIndex((page: any) => page.id === item.id) === index
    })

    // Create a basic recordMap with properly structured page blocks
    const recordMap: any = {
      block: {},
      collection: {},
      collection_view: {},
      notion_user: {}
    }

    // Add properly structured block entries for each found page
    for (const item of uniquePages) {
      const pageItem = item as any // Type assertion for proper API response access
      const title = pageItem.properties?.Name?.title?.[0]?.plain_text ||
                   pageItem.properties?.title?.title?.[0]?.plain_text ||
                   'Untitled'

      recordMap.block[pageItem.id] = {
        value: {
          id: pageItem.id,
          version: 1,
          type: 'page',
          properties: {
            title: [[title]]
          },
          content: [],
          format: {
              page_icon: '',
              page_cover: '',
              page_cover_position: 0.5
            },
          permissions: [{
            role: 'reader',
            type: 'public_permission'
          }],
          created_time: new Date(pageItem.created_time).getTime(),
          last_edited_time: new Date(pageItem.last_edited_time).getTime(),
          parent_id: pageItem.parent?.database_id || pageItem.parent?.page_id || '',
          parent_table: 'block',
          alive: true,
          space_id: ''
        }
      }
    }

    // Convert the official API response to our expected format
    const results: types.SearchResults = {
      recordMap,
      results: uniquePages.map((item: any) => {
        if (item.object === 'page') {
          let title = 'Untitled'
          let description = ''
          
          if (item.properties) {
            const titleProp = item.properties.title || 
                            item.properties.Title || 
                            item.properties.Name ||
                            item.properties.name
            
            if (titleProp?.title?.[0]?.plain_text) {
              title = titleProp.title[0].plain_text
            } else if (titleProp?.rich_text?.[0]?.plain_text) {
              title = titleProp.rich_text[0].plain_text
            }

            const descProp = item.properties.Description || 
                           item.properties.description ||
                           item.properties.Summary ||
                           item.properties.summary
            
            if (descProp?.rich_text?.[0]?.plain_text) {
              description = descProp.rich_text[0].plain_text
              if (description.length > 100) {
                description = description.slice(0, 100) + '...'
              }
            }
          }
          
          if (title === 'Untitled' && item.properties) {
            const firstProperty = Object.values(item.properties)[0] as any
            if (firstProperty?.title?.[0]?.plain_text) {
              title = firstProperty.title[0].plain_text
            } else if (firstProperty?.rich_text?.[0]?.plain_text) {
              title = firstProperty.rich_text[0].plain_text
            }
          }

          return {
            id: item.id,
            isNavigable: true,
            score: 1.0,
            highlight: {
              pathText: description || 'No description available',
              text: title
            }
          }
        }
        return null
      }).filter(Boolean),
      total: uniquePages.length
    }

    return results
  } catch (err) {
    console.error('Official Notion API search error:', err)
    throw err
  }
}