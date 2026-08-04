import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function useDb() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = mysql.createPool({
      host: config.dbHost,
      port: Number(config.dbPort),
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      dateStrings: true,
      charset: 'utf8mb4',
      timezone: 'local'
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: Record<string, unknown> | unknown[]) {
  const db = useDb()
  const [rows] = await db.query(sql, params as any)
  return rows as T
}

export function createId(prefix = '') {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  return prefix ? `${prefix}_${id}` : id
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value.replace(' ', 'T')) : value
  if (Number.isNaN(d.getTime())) {
    return String(value).slice(5, 16).replace('T', ' ')
  }
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}
