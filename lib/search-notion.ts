import ExpiryMap from 'expiry-map'
import pMemoize from 'p-memoize'

import type * as types from './types'
import { api } from './config'

export const searchNotion = pMemoize(searchNotionImpl, {
  cacheKey: (args) => args[0]?.query,
  cache: new ExpiryMap(10_000)
})

async function searchNotionImpl(
  params: types.SearchParams
): Promise<types.SearchResults> {
  return fetch(api.searchNotion, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'content-type': 'application/json'
    }
  })
    .then(async (res) => {
      if (res.ok) {
        return res
      }

      // convert non-2xx HTTP responses into errors
      const error: any = new Error(res.statusText)

      try {
        const body: any = await res.json()
        error.message = body.details || body.error || res.statusText
        console.error('Search API Error:', JSON.stringify(body, null, 2))
      } catch {
        // ignore json parse errors
      }

      error.response = res
      throw error
    })
    .then((res) => res.json() as Promise<types.SearchResults>)

  // return ky
  //   .post(api.searchNotion, {
  //     json: params
  //   })
  //   .json()
}
