import { mapReview, type ReviewRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const status = typeof q.status === 'string' ? q.status : 'all'

  const where: string[] = ['1=1']
  const params: Record<string, unknown> = {}

  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    where.push('status = :status')
    params.status = status
  }

  const rows = await query<ReviewRow[]>(
    `SELECT * FROM reviews WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
    params
  )

  const countsRows = await query<any[]>(`
    SELECT
      COUNT(*) AS all_count,
      SUM(status = 'pending') AS pending_count,
      SUM(status = 'approved') AS approved_count,
      SUM(status = 'rejected') AS rejected_count
    FROM reviews
  `)

  return {
    data: rows.map(mapReview),
    meta: {
      counts: {
        all: Number(countsRows[0]?.all_count || 0),
        pending: Number(countsRows[0]?.pending_count || 0),
        approved: Number(countsRows[0]?.approved_count || 0),
        rejected: Number(countsRows[0]?.rejected_count || 0)
      }
    }
  }
})
