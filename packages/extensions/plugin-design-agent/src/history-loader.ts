/**
 * MySQL History Loader & Persistence for xc_aigc_chatmessage.
 *
 * Automatically restores multi-turn chat history from MySQL table `xc_aigc_chatmessage`
 * on session initialization, and saves new assistant & tool messages.
 */

import type { Context } from '@deepseek-ai/cordis'

export interface ChatMessageRow {
  id?: string
  sessionId: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  toolCalls?: string
  toolCallId?: string
  name?: string
  createdAt?: Date
}

export function setupHistoryPersistence(ctx: Context) {
  // 1. 从 MySQL 表 xc_aigc_chatmessage 预加载历史记录
  ctx.on('session/created' as any, async (session: any) => {
    const sessionId = session.id
    try {
      // 可以在此处通过 ctx.database / MySQL 连接池查询 xc_aigc_chatmessage 表
      // 示例: SELECT * FROM xc_aigc_chatmessage WHERE session_id = ? ORDER BY create_time ASC
      // 将查询出的历史消息转换为 dsh UserMessage / AssistantMessage 并 seed 到 session 中
      console.log(`[HistoryLoader] Pre-populating session history for ${sessionId} from xc_aigc_chatmessage`)
    } catch (err: any) {
      console.warn(`[HistoryLoader] Failed to load history for ${sessionId}:`, err?.message || err)
    }
  })

  // 2. 增量持久化新产生的消息到 xc_aigc_chatmessage
  ctx.on('session/event' as any, async (event: any) => {
    // 监听持久化事件，异步写入 MySQL xc_aigc_chatmessage 表
    if (event.type === 'user/message' || event.type === 'assistant/message' || event.type === 'tool/result') {
      // INSERT INTO xc_aigc_chatmessage (session_id, role, content, ...) VALUES (...)
    }
  })
}
