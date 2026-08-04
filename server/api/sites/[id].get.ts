import { mapSite, type SiteRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少站点 ID' })

  const rows = await query<SiteRow[]>(
    `SELECT s.*, c.name AS category_name
     FROM sites s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE s.id = :id`,
    { id }
  )

  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: '站点不存在' })
  }

  return { data: mapSite(rows[0]) }
})
