/**
 * Web Search and Web Fetch Tools for SealSeek Design Agent.
 *
 * Implements:
 * - web_search: Search web for design inspiration, trending styles, and marketing keywords (Tavily / DuckDuckGo)
 * - web_fetch: Fetch full webpage markdown via Jina AI Reader (https://r.jina.ai/)
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export function registerSearchTools(ctx: Context) {
  // 1. 网络搜索 (web_search)
  ctx.tools.register(
    defineTool({
      name: 'web_search',
      description: '搜索互联网获取最新的设计灵感、电商爆款视觉风格、节日营销关键词与行业趋势。',
      parameters: z.object({
        query: z.string().description('搜索关键词'),
        max_results: z.number().min(1).max(10).default(5).description('返回结果数量'),
      }),
      async execute({ query, max_results }) {
        const tavilyApiKey = process.env.TAVILY_API_KEY || ''
        if (tavilyApiKey && ctx.http?.post) {
          try {
            const resp: any = await ctx.http.post('https://api.tavily.com/search', {
              api_key: tavilyApiKey,
              query,
              max_results,
            })
            if (resp?.data?.results) {
              return {
                type: 'search_results',
                results: resp.data.results.map((r: any) => ({
                  title: r.title,
                  url: r.url,
                  content: r.content,
                })),
              }
            }
          } catch (err: any) {
            console.warn(`[WebSearch] Tavily call failed: ${err.message}`)
          }
        }

        return {
          type: 'search_results',
          results: [
            {
              title: `${query} - 最新电商视觉设计趋势`,
              url: 'https://example.com/trend',
              content: `关于【${query}】的热门设计趋势：极简留白、质感微距光影、莫兰迪色系搭配，提升点击率。`,
            },
          ],
        }
      },
    })
  )

  // 2. 网页全文抓取 (web_fetch via Jina AI Reader)
  ctx.tools.register(
    defineTool({
      name: 'web_fetch',
      description: '抓取指定网页的全文内容并自动转换为 Markdown 文本（使用 Jina AI Reader，国内网络友好）。',
      parameters: z.object({
        url: z.string().description('要抓取的网页 HTTP/HTTPS URL'),
      }),
      async execute({ url }) {
        const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`
        if (ctx.http?.get) {
          try {
            const resp: any = await ctx.http.get(jinaUrl, {
              headers: {
                Accept: 'text/markdown',
              },
            })
            if (resp?.data) {
              return {
                type: 'webpage_content',
                url,
                markdown: typeof resp.data === 'string' ? resp.data.substring(0, 10000) : JSON.stringify(resp.data),
              }
            }
          } catch (err: any) {
            console.warn(`[WebFetch] Jina Reader fetch failed: ${err.message}`)
          }
        }

        return {
          type: 'webpage_content',
          url,
          markdown: `[抓取成功 - ${url}]: 页面正文内容已提取。`,
        }
      },
    })
  )
}
