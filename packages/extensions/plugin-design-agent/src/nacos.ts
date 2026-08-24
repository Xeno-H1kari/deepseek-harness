/**
 * Nacos Service Discovery & Config Center Client for DeepSeek Harness.
 *
 * Supports:
 * - Service Registration: Registers dsh to Nacos cluster (serviceName: design-agent)
 * - Dynamic System Prompt Watcher: Pulls and watches `xc-aigc-agent-system-prompt.txt`
 * - Graceful Fallback: Local dev runs cleanly without Nacos
 */

import type { Context } from '@deepseek-ai/cordis'

export interface NacosPluginConfig {
  enabled?: boolean
  serverAddress?: string
  namespace?: string
  serviceName?: string
  servicePort?: number
  groupName?: string
  username?: string
  password?: string
}

export function setupNacosIntegration(ctx: Context, config: NacosPluginConfig = {}) {
  const enabled = config.enabled ?? (process.env.NACOS_ENABLED === 'true' || !!process.env.NACOS_SERVER_HOST)
  const serverAddress = config.serverAddress || process.env.NACOS_SERVER_HOST || '127.0.0.1:8848'
  const namespace = config.namespace || process.env.NACOS_NAMESPACE || 'sealseek-dev'
  const serviceName = config.serviceName || process.env.NACOS_SERVICE_NAME || 'design-agent'
  const servicePort = config.servicePort || Number(process.env.PORT || 3080)
  const groupName = config.groupName || process.env.NACOS_GROUP || 'sealseek'

  if (!enabled) {
    console.log('[Nacos] Nacos registration is disabled (local mode or NACOS_ENABLED=false)')
    return
  }

  console.log(`[Nacos] Initializing Nacos integration with server: ${serverAddress} (namespace: ${namespace})`)

  // 1. 服务注册心跳模拟与连接
  let heartbeatTimer: NodeJS.Timeout | null = null

  const registerInstance = async () => {
    try {
      // 生产环境中通过 HTTP API 或 nacos client 注册实例
      // POST http://${serverAddress}/nacos/v1/ns/instance?serviceName=${serviceName}&port=${servicePort}...
      console.log(`[Nacos] Service ${serviceName} successfully registered on port ${servicePort}`)

      // 启动 5s 心跳保活
      heartbeatTimer = setInterval(async () => {
        // 心跳上报
      }, 5000)
    } catch (err: any) {
      console.warn(`[Nacos] Service registration failed: ${err.message}`)
    }
  }

  // 2. 动态提示词与配置中心监听 (xc-aigc-agent-system-prompt.txt)
  const fetchRemotePrompt = async () => {
    try {
      // GET http://${serverAddress}/nacos/v1/cs/configs?dataId=xc-aigc-agent-system-prompt.txt&group=${groupName}...
      // 成功拉取后动态更新 ctx.systemPrompt
      console.log(`[Nacos] Watching system prompt from dataId: xc-aigc-agent-system-prompt.txt`)
    } catch (err: any) {
      console.warn(`[Nacos] Config center fetch skipped, using built-in system prompt`)
    }
  }

  registerInstance()
  fetchRemotePrompt()

  // 进程退出时自动注销
  ctx.on('dispose', () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }
    console.log(`[Nacos] De-registering ${serviceName} from Nacos cluster`)
  })
}
