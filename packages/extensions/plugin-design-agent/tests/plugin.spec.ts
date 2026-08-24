import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import * as DesignAgentPlugin from '../src/index.js'

describe('plugin-design-agent', () => {
  it('registers all design, video, canvas and compliance tools into ctx.tools', async () => {
    const ctx = new Context()
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(DesignAgentPlugin)

    expect(ctx.tools).toBeDefined()
    const tools = ctx.tools.list()
    const toolNames = tools.map((t: any) => t.name)

    // Image Tools
    expect(toolNames).toContain('text_to_image')
    expect(toolNames).toContain('reference_to_image')
    expect(toolNames).toContain('edit_image')

    // Video Tools
    expect(toolNames).toContain('text_to_video')
    expect(toolNames).toContain('image_to_video')
    expect(toolNames).toContain('reference_to_video')
    expect(toolNames).toContain('analyze_video')

    // Canvas & Planning Tools
    expect(toolNames).toContain('place_elements')
    expect(toolNames).toContain('view_image')
    expect(toolNames).toContain('load_guideline')
    expect(toolNames).toContain('generate_mindmap')
    expect(toolNames).toContain('ask_clarification')
    expect(toolNames).toContain('feature_extraction')
    expect(toolNames).toContain('compliance_check')
    expect(toolNames).toContain('generate_prompt_plan')
    expect(toolNames).toContain('create_skill')
    expect(toolNames).toContain('update_skill')
  })

  it('executes text_to_image tool with explicit seed and Volcano SeeDream model', async () => {
    const ctx = new Context()
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(DesignAgentPlugin)

    const textToImage = ctx.tools.get('text_to_image')
    expect(textToImage).toBeDefined()

    const result = await textToImage.execute({
      prompt: '极简北欧风白色咖啡杯，晨光侧入，陶瓷光泽，高品质电商主图',
      aspect_ratio: '1:1',
      seed: 888888,
    })

    expect(result).toHaveProperty('type', 'image')
    expect(result).toHaveProperty('url')
    expect(result.url).toContain('https://oss.sealseek.com')
    expect(result.seed).toBe(888888)
    expect(result.model).toBe('doubao-seedream-5-0-260128')
    expect(result.width).toBe(2048)
    expect(result.height).toBe(2048)
  })

  it('injects design agent persona into system prompt', async () => {
    const ctx = new Context()
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(DesignAgentPlugin)

    expect(ctx.systemPrompt).toBeDefined()
    const section = ctx.systemPrompt.getSection('design-agent-persona')
    expect(section).toBeDefined()
    const promptContent = section?.content?.()
    expect(promptContent).toContain('SealSeek')
    expect(promptContent).toContain('电商视觉设计')
  })
})
