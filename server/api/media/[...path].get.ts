export default defineEventHandler(async (event) => {
  if (!isCosEnabled()) {
    throw createError({ statusCode: 503, statusMessage: 'COS 未配置' })
  }

  const parts = getRouterParam(event, 'path')
  const rawPath = Array.isArray(parts) ? parts.join('/') : String(parts || '')
  const objectKey = toCosKey(rawPath.startsWith('/') ? rawPath : `/${rawPath}`)

  if (!objectKey || objectKey.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: '无效的图片路径' })
  }

  try {
    const { body, contentType, contentLength } = await getObjectStream(objectKey)
    setHeader(event, 'Content-Type', contentType || guessContentType(objectKey))
    if (contentLength) setHeader(event, 'Content-Length', String(contentLength))
    setHeader(event, 'Cache-Control', 'public, max-age=86400')
    setHeader(event, 'Cross-Origin-Resource-Policy', 'cross-origin')
    return body
  } catch (e: any) {
    throw createError({
      statusCode: e?.statusCode || 404,
      statusMessage: e?.message || '图片不存在'
    })
  }
})

function guessContentType(key: string) {
  const ext = key.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon'
  }
  return (ext && map[ext]) || 'application/octet-stream'
}
