/**
 * Billing Hook: Handles point/token deduction for tool executions and turns.
 */

import type { Context } from '@deepseek-ai/cordis'

export interface BillingConfig {
  /** Java billing service endpoint (xc-sealseek-infinitecanvas) */
  endpoint?: string
  /** Points cost per image generation */
  imagePointsCost?: number
  /** Points cost per video generation */
  videoPointsCost?: number
}

export function setupBillingHook(ctx: Context, config: BillingConfig = {}) {
  const billingEndpoint = config.endpoint || process.env.BILLING_SERVICE_URL || 'http://localhost:40001/api/internal/billing/deduct'
  const imageCost = config.imagePointsCost || 5
  const videoCost = config.videoPointsCost || 20

  // 监听工具执行后事件，进行异步计费扣减
  ctx.on('tools/post-execute', async ({ tool, result, agent }) => {
    let cost = 0
    if (tool.name === 'text_to_image' || tool.name === 'reference_to_image' || tool.name === 'edit_image') {
      cost = imageCost
    } else if (tool.name === 'text_to_video' || tool.name === 'image_to_video') {
      cost = videoCost
    }

    if (cost > 0 && agent) {
      const userId = (agent.session.header as any)?.metadata?.userId || 'anonymous_user'
      try {
        // 异步上报 Java 账本中心扣减喜豆，不阻塞前端和模型主循环
        if (typeof ctx.http?.post === 'function') {
          await ctx.http.post(billingEndpoint, {
            userId,
            sessionId: agent.session.id,
            toolName: tool.name,
            points: cost,
            timestamp: Date.now(),
          })
        }
      } catch (err: any) {
        // 计费上报失败记录日志，避免影响正常业务
        console.error(`[Billing] Failed to deduct points for user ${userId}:`, err?.message || err)
      }
    }
  })
}
