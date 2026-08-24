/**
 * Business Middlewares & Waterfall Event Handlers for SealSeek Design Agent.
 *
 * Implements the core business middlewares from Python design-agent:
 * 1. Image Context & Fresh Start Detection (image_context_middleware)
 * 2. Edit Target Auto-Routing (edit_target_routing_middleware)
 * 3. 5-Tier Image Token Resolution (五层降级解析链)
 * 4. Design Intent Extraction & Suggestions Clean (流式设计意图提取)
 */

import type { Context } from '@deepseek-ai/cordis'
import { resolveImageToken } from './image-token.js'

const FRESH_START_PATTERNS = [
  '不参考之前',
  '不要参考之前',
  '忽略之前',
  '不要沿用之前',
  '重新做一张',
  '重新来一张',
  '全新做一张',
  '从头开始',
  '重新生成一张',
  '新做一张',
  '换一张',
  '来张新的',
]

export function setupBusinessMiddlewares(ctx: Context) {
  // 1. 拦截 agent/pre-step 事件：在模型每一步执行前处理图片上下文与路由
  ctx.waterfall('agent/pre-step', async (payload, next) => {
    const { agent, messages } = payload

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        if (typeof msg.content === 'string') {
          const userText = msg.content

          // 1.1 新起点检测（Fresh Start）：用户要求忽略历史图片
          const isFreshStart = FRESH_START_PATTERNS.some(p => userText.includes(p))
          if (isFreshStart) {
            agent.inject?.({
              role: 'user',
              content: '[系统标记]: 用户明确要求全新创作，请忽略前序生成的图片上下文，不携带旧图生成。',
            })
          }

          // 1.2 点选改图检测（Edit Target Routing）
          if (userText.includes('role=edit_target') || userText.includes('修改这幅图') || userText.includes('编辑此图')) {
            agent.inject?.({
              role: 'user',
              content: '[系统标记]: 用户明确点选了画板底图进行编辑，请优先使用 edit_image 工具。',
            })
          }
        }
      }
    }

    return await next()
  })

  // 2. 拦截 tools/pre-execute 事件：五层 Token 解析与参数清洗
  ctx.waterfall('tools/pre-execute', async (payload, next) => {
    const { tool, args, agent } = payload

    // 2.1 五层 Token 解析链：将 [产品图_a3f9] / [上传图_1] 解析为真实图片 URL
    if (args.base_image_url && typeof args.base_image_url === 'string') {
      const resolved = resolveImageToken(args.base_image_url)
      if (resolved) {
        args.base_image_url = resolved
      }
    }

    if (args.reference_images && Array.isArray(args.reference_images)) {
      args.reference_images = args.reference_images.map((token: string) => resolveImageToken(token) || token)
    }

    // 2.2 生图单次数量硬约束守卫
    if (tool.name === 'text_to_image' || tool.name === 'reference_to_image') {
      if (args.prompt && /([2-9两三四五六七八九]张|九宫格|批量)/.test(args.prompt)) {
        args.prompt = args.prompt.replace(/([2-9两三四五六七八九]张|九宫格|批量)/g, '1张')
      }
    }

    return await next()
  })
}
