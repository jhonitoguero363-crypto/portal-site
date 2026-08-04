import COS from 'cos-nodejs-sdk-v5'

type CosRuntimeConfig = {
  secretId?: string
  secretKey?: string
  bucket?: string
  region?: string
  /** Object key prefix, e.g. uploads — empty means use path as-is */
  prefix?: string
  /** Signed URL lifetime in seconds */
  expires?: number | string
  /** Optional custom domain, e.g. cdn.example.com (no protocol) */
  domain?: string
}

let client: COS | null = null

function getCosConfig(): CosRuntimeConfig {
  const config = useRuntimeConfig()
  return (config.cos || {}) as CosRuntimeConfig
}

export function isCosEnabled() {
  const cos = getCosConfig()
  return Boolean(cos.secretId && cos.secretKey && cos.bucket && cos.region)
}

function getClient() {
  if (client) return client
  const cos = getCosConfig()
  if (!cos.secretId || !cos.secretKey) {
    throw createError({ statusCode: 500, statusMessage: 'COS 未配置' })
  }
  client = new COS({
    SecretId: cos.secretId,
    SecretKey: cos.secretKey
  })
  return client
}

/** Normalize DB icon value to COS object Key */
export function toCosKey(icon: string) {
  let value = icon.trim()
  if (!value) return ''

  // Already a full URL — extract pathname if same bucket/domain, else leave empty
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value)
      value = decodeURIComponent(u.pathname)
    } catch {
      return ''
    }
  }

  value = value.replace(/^\/+/, '')
  // Strip our own media proxy prefix if present
  value = value.replace(/^api\/media\//, '')

  const cos = getCosConfig()
  const prefix = (cos.prefix || '').replace(/^\/+|\/+$/g, '')

  if (prefix && !value.startsWith(`${prefix}/`) && !value.startsWith('uploads/')) {
    value = `${prefix}/${value}`
  }

  return value
}

export function getSignedObjectUrl(key: string) {
  const cos = getCosConfig()
  const expires = Number(cos.expires || 3600)
  return getClient().getObjectUrl({
    Bucket: cos.bucket!,
    Region: cos.region!,
    Key: key,
    Sign: true,
    Expires: expires,
    Protocol: 'https:',
    ...(cos.domain
      ? { Domain: cos.domain.replace(/^https?:\/\//, '') }
      : {})
  })
}

export async function getObjectStream(key: string): Promise<{
  body: Buffer
  contentType?: string
  contentLength?: number
}> {
  const cos = getCosConfig()
  const data = await getClient().getObject({
    Bucket: cos.bucket!,
    Region: cos.region!,
    Key: key
  })

  const headers = (data as any).headers || {}
  return {
    body: Buffer.from(data.Body as ArrayBuffer | Buffer),
    contentType: headers['content-type'] || headers['Content-Type'],
    contentLength: Number(headers['content-length'] || headers['Content-Length'] || 0) || undefined
  }
}

/**
 * Resolve icon path for frontend.
 * Private COS → same-origin proxy `/api/media/...` (avoids browser 403 / expired sign issues).
 * Otherwise keep original path / absolute URL.
 */
export function resolveIconUrl(icon?: string | null) {
  const raw = icon?.trim() || ''
  if (!raw) return ''

  if (!isCosEnabled()) {
    return raw
  }

  // Keep external non-COS absolute URLs as-is
  if (/^https?:\/\//i.test(raw)) {
    const cos = getCosConfig()
    const hostHints = [
      '.myqcloud.com',
      '.tencentcos.cn',
      cos.domain || ''
    ].filter(Boolean)
    const isOurCos = hostHints.some(h => raw.includes(h))
    if (!isOurCos) return raw
  }

  const Key = toCosKey(raw)
  if (!Key) return raw

  return `/api/media/${Key.split('/').map(encodeURIComponent).join('/')}`
}
