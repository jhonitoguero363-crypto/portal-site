import { mapSite, type SiteRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const status = typeof q.status === 'string' ? q.status : 'all'
  const categoryId = typeof q.categoryId === 'string' ? q.categoryId : ''
  const keyword = typeof q.q === 'string' ? q.q.trim() : ''
  const hot = q.hot === '1' || q.hot === 'true'
  const page = Math.max(1, Number(q.page || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize || 20)))
  const offset = (page - 1) * pageSize

  const where: string[] = ['1=1']
  const params: Record<string, unknown> = {}

  if (status === 'online' || status === 'hidden') {
    where.push('s.status = :status')
    params.status = status
  }
  if (categoryId && categoryId !== 'all') {
    where.push('s.category_id = :categoryId')
    params.categoryId = categoryId
  }
  if (hot) {
    where.push('s.is_hot = 1')
  }
  if (keyword) {
    where.push('(s.name LIKE :keyword OR s.description LIKE :keyword OR c.name LIKE :keyword)')
    params.keyword = `%${keyword}%`
  }

  const whereSql = where.join(' AND ')

  const countRows = await query<any[]>(
    `SELECT COUNT(*) AS total
     FROM sites s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE ${whereSql}`,
    params
  )
  const total = Number(countRows[0]?.total || 0)

  const rows = await query<SiteRow[]>(
    `SELECT s.*, c.name AS category_name
     FROM sites s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE ${whereSql}
     ORDER BY s.is_hot DESC, s.updated_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  )

  return {
    data: rows.map(mapSite),
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      counts: await getStatusCounts()
    }
  }
})

async function getStatusCounts() {
  const rows = await query<any[]>(`
    SELECT
      COUNT(*) AS all_count,
      SUM(status = 'online') AS online_count,
      SUM(status = 'hidden') AS hidden_count
    FROM sites
  `)
  return {
    all: Number(rows[0]?.all_count || 0),
    online: Number(rows[0]?.online_count || 0),
    hidden: Number(rows[0]?.hidden_count || 0)
  }
}
