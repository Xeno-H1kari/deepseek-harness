/**
 * Mindmap Tool for SealSeek Design Agent.
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export function registerMindmapTools(ctx: Context) {
  ctx.tools.register(
    defineTool({
      name: 'generate_mindmap',
      description: '生成视觉设计方案或电商营销策划的思维导图节点树。',
      parameters: z.object({
        topic: z.string().description('思维导图核心主题'),
        nodes: z.array(z.object({
          id: z.string(),
          text: z.string(),
          children: z.array(z.string()).optional(),
        })).description('思维导图节点树结构'),
      }),
      async execute({ topic, nodes }) {
        return {
          type: 'mindmap',
          topic,
          nodes,
        }
      },
    })
  )
}
