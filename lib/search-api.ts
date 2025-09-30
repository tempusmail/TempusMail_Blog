import type * as types from './types'
import { search } from './notion'
import { searchWithIntegration } from './notion-integration'

export async function handleSearchRequest(
  searchParams: types.SearchParams
): Promise<types.SearchResults> {
  try {
    const results = process.env.NOTION_API_KEY && !process.env.NOTION_TOKEN_V2
      ? await searchWithIntegration(searchParams)
      : await search(searchParams)

    return results
  } catch (err: any) {
    console.error('Search error:', err)
    
    // Check if it's an authentication error
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      const authError = new Error('Authentication failed. Please check your NOTION_TOKEN_V2 or NOTION_API_KEY environment variable.')
      authError.name = 'AuthenticationError'
      throw authError
    }
    
    const searchError = new Error(err?.message || 'Search failed')
    searchError.name = 'SearchError'
    throw searchError
  }
}