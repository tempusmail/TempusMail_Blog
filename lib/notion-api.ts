import { NotionAPI } from 'notion-client'

// Support private Notion workspaces by reading an auth token from env.
// Prefer NOTION_TOKEN_V2 (cookie value), fallback to NOTION_TOKEN if provided.
const authToken = process.env.NOTION_TOKEN_V2 || process.env.NOTION_TOKEN

// Use the public Notion site API endpoint as a workaround for API issues
// This should be in the format: https://<your-workspace>.notion.site/api/v3
const apiBaseUrl = process.env.NOTION_API_BASE_URL || undefined

export const notion = new NotionAPI({
  apiBaseUrl,
  authToken
})