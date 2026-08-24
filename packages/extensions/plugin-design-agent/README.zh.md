# @deepseek-ai/dsh-plugin-design-agent

SealSeek 无限画板设计智能体插件（面向 DeepSeek Harness）。

## 功能特性

- **AIGC 视觉创作工具集**：纯文生图（`text_to_image`）、参考图生图（`reference_to_image`）、局部编辑（`edit_image`）、文/图生视频（`text_to_video`/`image_to_video`）、思维导图（`generate_mindmap`）。
- **前端直连 SSE 协议桥接**：内置 `/api/aigc/canvas/chatStream`，100% 兼容画板前端（`messages/partial`、`tasks/start`、`oss_upload`、`complete` 等）。
- **计费与生命周期 Hook**：异步通知业务网关扣减喜豆，不阻塞模型流式生成。
- **可组装性**：支持作为 Agent Preset 或独立 Cordis 插件动态挂载与卸载。
