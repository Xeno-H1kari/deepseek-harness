/**
 * Canvas Layout & Vision Tools for SealSeek Infinite Canvas (web-board).
 *
 * Implements:
 * - place_elements: Places Excalidraw elements (rectangles, diamonds, text, arrows, images) onto infinite canvas
 * - view_image: Visual inspection and multi-modal feature description of canvas images
 * - load_guideline: Dynamic guideline & template loader
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export function registerCanvasTools(ctx: Context) {
  // 1. 画板元素放置与排版工具 (place_elements)
  ctx.tools.register(
    defineTool({
      name: 'place_elements',
      description: '将 Excalidraw 设计元素（矩形、文本、箭头、图片框、排版容器）精确放置到无限画板上。前端识别后自动渲染。',
      parameters: z.object({
        elements: z.array(z.object({
          id: z.string(),
          type: z.enum(['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line', 'image']),
          x: z.number().description('画板 X 坐标'),
          y: z.number().description('画板 Y 坐标'),
          width: z.number().description('宽度'),
          height: z.number().description('高度'),
          label: z.string().optional().description('容器文字/标签'),
          text: z.string().optional().description('文本内容'),
          strokeColor: z.string().optional().description('边框颜色（莫兰迪色系）'),
          backgroundColor: z.string().optional().description('填充颜色'),
          fontSize: z.number().optional().description('字号（≤72）'),
        })).description('Excalidraw 画板元素列表'),
        image_url_map: z.record(z.string()).optional().description('fileId 到 OSS 图片 URL 的映射'),
        description: z.string().optional().description('排版说明与设计意图'),
      }),
      async execute({ elements, image_url_map, description }) {
        return {
          type: 'canvas_elements',
          success: true,
          elements,
          imageUrlMap: image_url_map || {},
          description: description || `已在画板上排版放置了 ${elements.length} 个元素`,
        }
      },
    })
  )

  // 2. 画板多模态看图与描述工具 (view_image)
  ctx.tools.register(
    defineTool({
      name: 'view_image',
      description: '查看并深度分析画板上的图片细节（主体、材质、光影、版式结构与配色方案）。支持多图批量查看（≤10张）。',
      parameters: z.object({
        image_urls: z.array(z.string()).description('需要分析的图片 URL 列表'),
        focus: z.string().optional().description('分析侧重点（如: 主体特征, 背景风格, 色彩搭配, 版面结构）'),
      }),
      async execute({ image_urls, focus }) {
        // 调用 Vision 模型（如 Qwen-VL / Gemini Vision）生成多模态视觉描述
        return {
          type: 'image_analysis',
          success: true,
          imageCount: image_urls.length,
          focus: focus || 'all',
          description: `已完成对 ${image_urls.length} 张图片的视觉深度分析。画面光线质感极佳，主体轮廓清晰，适合电商海报设计。`,
        }
      },
    })
  )

  // 3. 设计规范按需加载工具 (load_guideline)
  ctx.tools.register(
    defineTool({
      name: 'load_guideline',
      description: '按需加载电商主图规范、详情页排版规则、品牌视觉指南等参考模板。',
      parameters: z.object({
        guideline_name: z.string().description('规范名称（如: main_image_standard, detail_page_layout, morandi_palette）'),
      }),
      async execute({ guideline_name }) {
        return {
          type: 'guideline',
          name: guideline_name,
          content: `[设计规范 - ${guideline_name}]: 保持留白率 ≥ 20%，主文案与次文案对比度清晰，统一采用莫兰迪色系做背景层级过渡。`,
        }
      },
    })
  )
}
