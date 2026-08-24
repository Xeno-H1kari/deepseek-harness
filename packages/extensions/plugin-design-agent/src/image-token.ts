/**
 * Image Token 5-tier Fallback Parser (图片 Token 五层降级解析链).
 *
 * Resolves fuzzy/explicit image references across turns without hallucination:
 * 1. Direct HTTP URL
 * 2. [上传图_N] (Frontend temporary token based on imageParams.images position)
 * 3. [产品图_a3f9] (4-character hex short code based on image_id)
 * 4. [产品图_1] (Sequential numeric index for backward compatibility)
 * 5. [产品图] / Name fallback (e.g. [极简Logo])
 */

export interface ImageTokenContext {
  referenceImages?: Record<string, any>
  generatedImages?: Record<string, any>
  uploadedImages?: string[]
}

export function resolveImageToken(
  tokenOrUrl: string,
  context: ImageTokenContext = {}
): string | null {
  if (!tokenOrUrl || typeof tokenOrUrl !== 'string') {
    return null
  }

  const raw = tokenOrUrl.trim()

  // 1. Direct HTTP / OSS URL
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('oss://')) {
    return raw
  }

  const { referenceImages = {}, generatedImages = {}, uploadedImages = [] } = context

  // 2. [上传图_N] 前端临时 token
  const uploadMatch = raw.match(/^\[(?:上传图|upload)_?(\d+)\]$/i)
  if (uploadMatch) {
    const idx = parseInt(uploadMatch[1], 10) - 1
    if (idx >= 0 && idx < uploadedImages.length) {
      return uploadedImages[idx]
    }
  }

  // 3. [产品图_a3f9] 4位 hex 短码精确命中
  const hexMatch = raw.match(/^\[(?:产品图|product)_?([0-9a-f]{4})\]$/i)
  if (hexMatch) {
    const hex = hexMatch[1].toLowerCase()
    // 从已生成/参考图中查找短码
    for (const [url, meta] of Object.entries({ ...referenceImages, ...generatedImages })) {
      const imgId = typeof meta === 'object' ? meta?.id || meta?.imageId : url
      if (imgId && typeof imgId === 'string' && imgId.toLowerCase().includes(hex)) {
        return url
      }
    }
  }

  // 4. [产品图_1] 序号位置命中
  const numMatch = raw.match(/^\[(?:产品图|product)_?(\d+)\]$/i)
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1
    const allUrls = Object.keys({ ...referenceImages, ...generatedImages })
    if (idx >= 0 && idx < allUrls.length) {
      return allUrls[idx]
    }
  }

  // 5. [产品图] 无后缀单图或名称兜底
  if (raw === '[产品图]' || raw === '[底图]' || raw === '[参考图]') {
    const allUrls = Object.keys(referenceImages)
    if (allUrls.length > 0) {
      return allUrls[0]
    }
    const genUrls = Object.keys(generatedImages)
    if (genUrls.length > 0) {
      return genUrls[genUrls.length - 1]
    }
  }

  return null
}
