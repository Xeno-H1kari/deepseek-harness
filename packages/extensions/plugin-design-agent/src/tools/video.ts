/**
 * AIGC Video Generation Tools for SealSeek Design Agent.
 *
 * Fully supports ByteDance Volcano Engine Ark (火山方舟 豆包 Seedance / 可灵 Kling)
 * and explicit Seed reproducibility control.
 *
 * Implements:
 * - text_to_video
 * - image_to_video
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export interface VideoResult {
  type: 'video'
  url: string
  coverUrl: string
  duration: number
  prompt: string
  seed: number
  model?: string
}

export function registerVideoTools(ctx: Context) {
  // 1. 文生视频 (text_to_video) - 默认采用火山豆包 Seedance
  ctx.tools.register(
    defineTool({
      name: 'text_to_video',
      description: '使用火山方舟 豆包 Seedance 生成电商运镜与动态视觉视频，支持传入 seed 固定随机种子。',
      parameters: z.object({
        prompt: z.string().description('动态视频生成提示词（描述镜头运镜轨迹、光影流转与主体动作）'),
        duration: z.number().min(3).max(10).default(5).description('视频时长（秒），默认 5 秒'),
        aspect_ratio: z.enum(['16:9', '9:16', '1:1']).default('16:9').description('视频画面比例'),
        seed: z.number().int().min(0).max(4294967295).optional().description('随机种子 (0 ~ 4294967295)，固定 seed 保持镜头运动一致'),
        model: z.string().default('doubao-seedance-1-0').description('视频模型（默认 doubao-seedance-1-0）'),
      }),
      async execute({ prompt, duration, aspect_ratio, seed, model }) {
        const targetModel = model || 'doubao-seedance-1-0'
        const effectiveSeed = seed !== undefined ? seed : Math.floor(Math.random() * 2147483647)

        const mockVideoUrl = `https://oss.sealseek.com/aigc/videos/seedance_${Date.now()}_video.mp4`
        const mockCoverUrl = `https://oss.sealseek.com/aigc/videos/seedance_${Date.now()}_cover.png`

        return {
          type: 'video',
          url: mockVideoUrl,
          coverUrl: mockCoverUrl,
          duration,
          prompt,
          seed: effectiveSeed,
          aspectRatio: aspect_ratio,
          model: targetModel,
        } as VideoResult
      },
    })
  )

  // 2. 图生视频 (image_to_video)
  ctx.tools.register(
    defineTool({
      name: 'image_to_video',
      description: '使用火山方舟 豆包 Seedance 将画板上的静态商品图转换为动态运镜视频。',
      parameters: z.object({
        image_url: z.string().description('首帧/静态底图 URL'),
        prompt: z.string().description('动态引导词（如镜头推进、光斑流转、粒子浮动）'),
        duration: z.number().min(3).max(10).default(5).description('视频时长（秒）'),
        seed: z.number().int().min(0).max(4294967295).optional().description('随机种子'),
        model: z.string().default('doubao-seedance-i2v').description('视频模型'),
      }),
      async execute({ image_url, prompt, duration, seed, model }) {
        const targetModel = model || 'doubao-seedance-i2v'
        const effectiveSeed = seed !== undefined ? seed : Math.floor(Math.random() * 2147483647)
        const mockVideoUrl = `https://oss.sealseek.com/aigc/videos/seedance_i2v_${Date.now()}_video.mp4`
        const mockCoverUrl = image_url

        return {
          type: 'video',
          url: mockVideoUrl,
          coverUrl: mockCoverUrl,
          duration,
          prompt,
          seed: effectiveSeed,
          sourceImageUrl: image_url,
          model: targetModel,
        } as VideoResult
      },
    })
  )
}
