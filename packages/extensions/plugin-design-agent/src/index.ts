/**
 * SealSeek Design Agent Plugin for DeepSeek Harness (dsh).
 *
 * Full-featured pluggable Agent for SealSeek Infinite Canvas (web-board).
 *
 * @module @deepseek-ai/dsh-plugin-design-agent
 */

import type { Context } from '@deepseek-ai/cordis'
import { registerImageTools } from './tools/image.js'
import { registerVideoTools } from './tools/video.js'
import { registerAdvancedVideoTools } from './tools/video-advanced.js'
import { registerMindmapTools } from './tools/mindmap.js'
import { registerCanvasTools } from './tools/canvas.js'
import { registerClarificationTool } from './tools/clarification.js'
import { registerSkillManagementTools } from './tools/skills-mgmt.js'
import { registerPlanningAndComplianceTools } from './tools/planning-compliance.js'
import { registerSearchTools } from './tools/search.js'
import { setupSseCanvasBridge } from './sse-bridge.js'
import { setupBillingHook, type BillingConfig } from './billing.js'
import { setupBusinessMiddlewares } from './middlewares.js'
import { setupHistoryPersistence } from './history-loader.js'
import { setupNacosIntegration, type NacosPluginConfig } from './nacos.js'
import { setupRedisIntegration, type RedisConfig } from './redis.js'
import { DESIGN_AGENT_PERSONA, DESIGN_AGENT_PROMPT_ID } from './prompt.js'

export const name = 'plugin-design-agent'
export const inject = ['tools', 'systemPrompt', 'agents']

export interface DesignAgentPluginConfig extends BillingConfig, NacosPluginConfig, RedisConfig {
  /** Enable video generation tools (default: true) */
  enableVideo?: boolean
  /** Enable mindmap tools (default: true) */
  enableMindmap?: boolean
  /** Enable canvas layout tools (default: true) */
  enableCanvasTools?: boolean
  /** Enable web search & fetch tools (default: true) */
  enableSearch?: boolean
  /** Path to public design skills directory */
  skillsDirectory?: string
}

export function apply(ctx: Context, config: DesignAgentPluginConfig = {}) {
  // 1. 挂载 Redis 分布式会话锁与快照缓存
  setupRedisIntegration(ctx, config)

  // 2. 注册 AIGC 图像生成工具集 (text_to_image, reference_to_image, edit_image - 支持火山 SeeDream / NanoBanana / GPT-Image / Seed)
  registerImageTools(ctx)

  // 3. 注册 AIGC 视频生成工具集 (text_to_video, image_to_video, reference_to_video, analyze_video - 支持火山 豆包 Seedance / 可灵)
  if (config.enableVideo !== false) {
    registerVideoTools(ctx)
    registerAdvancedVideoTools(ctx)
  }

  // 4. 注册思维导图工具 (generate_mindmap)
  if (config.enableMindmap !== false) {
    registerMindmapTools(ctx)
  }

  // 5. 注册画板专属工具 (place_elements 排版放置, view_image 视觉看图, load_guideline 规范加载)
  if (config.enableCanvasTools !== false) {
    registerCanvasTools(ctx)
  }

  // 6. 注册结构化澄清与中断工具 (ask_clarification)
  registerClarificationTool(ctx)

  // 7. 注册规划与合规检测工具 (feature_extraction, compliance_check, generate_prompt_plan)
  registerPlanningAndComplianceTools(ctx)

  // 8. 注册网络搜索与全文抓取工具 (web_search, web_fetch)
  if (config.enableSearch !== false) {
    registerSearchTools(ctx)
  }

  // 9. 注册技能动态管理工具 (create_skill, update_skill)
  registerSkillManagementTools(ctx)

  // 10. 注册设计智能体系统人设与提示词段落
  if (ctx.systemPrompt?.addSection) {
    ctx.systemPrompt.addSection({
      id: DESIGN_AGENT_PROMPT_ID,
      priority: 100,
      content: () => DESIGN_AGENT_PERSONA,
    })
  }

  // 11. 挂载设计专属业务中间件 (图片上下文识别 / 点选编辑路由 / 5层Token降级 / 提示词清洗)
  setupBusinessMiddlewares(ctx)

  // 12. 挂载 MySQL xc_aigc_chatmessage 历史加载与增量持久化
  setupHistoryPersistence(ctx)

  // 13. 挂载 Nacos 服务注册与配置中心监听 (xc-aigc-agent-system-prompt.txt)
  setupNacosIntegration(ctx, config)

  // 14. 挂载画板前端直连的 SSE 协议与 REST 路由 (/api/aigc/canvas/chatStream, /chat/retry, /history, /sessions 等)
  setupSseCanvasBridge(ctx)

  // 15. 挂载喜豆计费与异步回调 Hook
  setupBillingHook(ctx, config)
}
