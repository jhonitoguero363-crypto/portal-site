import { mapCategory, type CategoryRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少分类 ID' })

  const body = await readBody<{ name?: string, sortOrder?: number }>(event)
  const name = body.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '分类名称不能为空' })
  }

  const sortOrder = Number(body.sortOrder ?? 99)
  const result = await query<any>(
    `UPDATE categories SET name = :name, sort_order = :sortOrder WHERE id = :id`,
    { id, name, sortOrder }
  )

  if (!result.affectedRows) {
    throw createError({ statusCode: 404, statusMessage: '分类不存在' })
  }

  const rows = await query<CategoryRow[]>(`
    SELECT c.*, COUNT(s.id) AS site_count
    FROM categories c
    LEFT JOIN sites s ON s.category_id = c.id AND s.status = 'online'
    WHERE c.id = :id
    GROUP BY c.id
  `, { id })

  return { data: mapCategory(rows[0]) }
})
