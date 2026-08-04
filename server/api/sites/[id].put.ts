import { mapSite, pickLetter, type SiteRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少站点 ID' })

  const body = await readBody<{
    name?: string
    description?: string
    url?: string
    categoryId?: string
    status?: 'online' | 'hidden'
    hot?: boolean
    color?: string
    letter?: string
    icon?: string
  }>(event)

  const existing = await query<SiteRow[]>(`SELECT * FROM sites WHERE id = :id`, { id })
  if (!existing.length) {
    throw createError({ statusCode: 404, statusMessage: '站点不存在' })
  }

  const current = existing[0]
  const name = body.name?.trim() || current.name
  const url = body.url?.trim() || current.url
  const categoryId = body.categoryId?.trim() || current.category_id
  const description = body.description !== undefined ? (body.description?.trim() || '') : current.description
  const status = body.status || current.status
  const isHot = body.hot !== undefined ? (body.hot ? 1 : 0) : current.is_hot
  const color = body.color?.trim() || current.color
  const letter = pickLetter(name, body.letter || current.letter)
  const icon = body.icon !== undefined ? (body.icon?.trim() || '') : (current.icon || '')

  const cats = await query<any[]>(`SELECT id FROM categories WHERE id = :id`, { id: categoryId })
  if (!cats.length) {
    throw createError({ statusCode: 400, statusMessage: '分类不存在' })
  }

  await query(
    `UPDATE sites
     SET name = :name,
         description = :description,
         url = :url,
         category_id = :categoryId,
         status = :status,
         is_hot = :isHot,
         color = :color,
         letter = :letter,
         icon = :icon
     WHERE id = :id`,
    { id, name, description, url, categoryId, status, isHot, color, letter, icon }
  )

  const rows = await query<SiteRow[]>(
    `SELECT s.*, c.name AS category_name
     FROM sites s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE s.id = :id`,
    { id }
  )

  return { data: mapSite(rows[0]) }
})
