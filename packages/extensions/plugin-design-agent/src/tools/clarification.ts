/**
 * Structured Clarification Tool for SealSeek Design Agent.
 *
 * Implements `ask_clarification` matching design-agent / SSE对接文档-前端.md:
 * - Emits clarification payload (question, clarification_type, options)
 * - Triggers agent interrupt / pause until user answers via frontend card
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export interface ClarificationPayload {
  kind: 'clarification_request'
  requestId: string
  question: string
  clarificationType: 'missing_info' | 'ambiguous_requirement' | 'approach_choice' | 'risk_confirmation' | 'suggestion'
  inputMode: 'choice_with_other' | 'free_text'
  context?: string
  options?: string[]
}

export function registerClarificationTool(ctx: Context) {
  ctx.tools.register(
    defineTool({
      name: 'ask_clarification',
      description: '向用户提出结构化澄清问题并暂停等待用户回答。在必需信息缺失、需求有歧义、需要方案选择或费用确认时调用。',
      parameters: z.object({
        question: z.string().description('要向用户提出的具体明确问题'),
        clarification_type: z.enum([
          'missing_info',
          'ambiguous_requirement',
          'approach_choice',
          'risk_confirmation',
          'suggestion',
        ]).default('missing_info').description('澄清类型'),
        context: z.string().optional().description('背景说明，帮助用户理解为何需要澄清'),
        options: z.array(z.string()).optional().description('候选选项列表（2-5 个，方案选择类推荐提供）'),
      }),
      async execute({ question, clarification_type, context, options }) {
        const payload: ClarificationPayload = {
          kind: 'clarification_request',
          requestId: `clarify_${Date.now()}`,
          question,
          clarificationType: clarification_type as any,
          inputMode: options && options.length > 0 ? 'choice_with_other' : 'free_text',
          context,
          options,
        }

        // 返回结构化澄清请求，SSE Bridge 会将其转换为 agent:interrupted 事件推送到前端
        return {
          type: 'clarification',
          ...payload,
        }
      },
    })
  )
}
