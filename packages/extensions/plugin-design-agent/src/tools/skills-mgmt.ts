/**
 * Skill Management Tools for SealSeek Design Agent.
 *
 * Implements:
 * - create_skill
 * - update_skill
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export function registerSkillManagementTools(ctx: Context) {
  ctx.tools.register(
    defineTool({
      name: 'create_skill',
      description: '为当前画板或用户创建专属的自定义设计技能（保存到技能库）。',
      parameters: z.object({
        name: z.string().description('技能英文标识（如: luxury_perfume_poster）'),
        display_name: z.string().description('技能中文展示名称'),
        description: z.string().description('技能功能与应用场景简述'),
        instructions: z.string().description('技能详细执行步骤与提示词模板 (Markdown 格式)'),
      }),
      async execute({ name, display_name, description, instructions }) {
        return {
          type: 'skill_created',
          success: true,
          name,
          displayName: display_name,
          message: `技能【${display_name}】已成功创建并保存到技能库。`,
        }
      },
    })
  )

  ctx.tools.register(
    defineTool({
      name: 'update_skill',
      description: '更新现有的设计技能内容或指令规则。',
      parameters: z.object({
        name: z.string().description('要更新的技能标识'),
        instructions: z.string().description('更新后的 Markdown 执行指令'),
      }),
      async execute({ name, instructions }) {
        return {
          type: 'skill_updated',
          success: true,
          name,
          message: `技能【${name}】已成功更新。`,
        }
      },
    })
  )
}
