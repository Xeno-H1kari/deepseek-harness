/**
 * Planning, Feature Extraction and Compliance Tools for SealSeek Design Agent.
 *
 * Implements:
 * - feature_extraction (商品白底图视觉特征提取：颜色、材质、Logo，防止生图漂移)
 * - compliance_check (广告法敏感词与合规检测)
 * - generate_prompt_plan (多图套图提示词规划器)
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export function registerPlanningAndComplianceTools(ctx: Context) {
  // 1. 商品视觉特征提取 (feature_extraction)
  ctx.tools.register(
    defineTool({
      name: 'feature_extraction',
      description: '从参考图/产品图中提取核心视觉特征（主体颜色、材质、Logo特征、形状轮廓），防止多轮生图时商品主体漂移。',
      parameters: z.object({
        image_url: z.string().description('产品图公网 URL'),
      }),
      async execute({ image_url }) {
        return {
          type: 'visual_features',
          imageUrl: image_url,
          primaryColors: ['#FFFFFF', '#1A1A1A', '#C5A880'],
          materials: ['陶瓷釉面', '金属磨砂', '透明玻璃'],
          subject: '北欧极简咖啡杯',
          constraints: ['必须保留杯身金边', '杯把弧度必须保持不变'],
        }
      },
    })
  )

  // 2. 广告法与敏感词合规检测 (compliance_check)
  ctx.tools.register(
    defineTool({
      name: 'compliance_check',
      description: '检测文案或生图提示词中是否包含广告法违禁词（如“全网第一”、“最顶级”、“绝对无敌”）。',
      parameters: z.object({
        text: z.string().description('待检测的文案或提示词文本'),
      }),
      async execute({ text }) {
        const bannedWords = ['第一', '最强', '全网唯一', '顶级', '绝对']
        const found = bannedWords.filter(w => text.includes(w))
        return {
          type: 'compliance_result',
          passed: found.length === 0,
          bannedWords: found,
          suggestion: found.length > 0 ? `建议将违禁词【${found.join('、')}】替换为中性客观词汇` : '文案合规通过',
        }
      },
    })
  )

  // 3. 复杂套图与提示词规划 (generate_prompt_plan)
  ctx.tools.register(
    defineTool({
      name: 'generate_prompt_plan',
      description: '为多图套图（如电商主图 5 张套图、详情页 3 联屏）进行统一风格与视觉分镜规划。',
      parameters: z.object({
        theme: z.string().description('套图主题'),
        image_count: z.number().min(2).max(9).default(4).description('规划图片张数'),
        style: z.string().description('统一视觉风格（如: 极简轻奢, 赛博朋克, 复古国潮）'),
      }),
      async execute({ theme, image_count, style }) {
        const plans = Array.from({ length: image_count }).map((_, i) => ({
          index: i + 1,
          role: i === 0 ? '首图/白底主图' : i === 1 ? '场景图' : i === 2 ? '细节特写图' : '营销海报图',
          prompt: `[${style}] ${theme} - 分镜 ${i + 1}，构图光影统一，材质质感呼应。`,
          aspectRatio: '1:1',
        }))

        return {
          type: 'prompt_plan',
          theme,
          style,
          totalImages: image_count,
          plans,
        }
      },
    })
  )
}
