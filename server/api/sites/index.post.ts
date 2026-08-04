import { createId } from '../../utils/db'
import { mapSite, pickLetter, type SiteRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
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

  const name = body.name?.trim()
  const url = body.url?.trim()
  const categoryId = body.categoryId?.trim()

  if (!name || !url || !categoryId) {
    throw createError({ statusCode: 400, statusMessage: '名称、链接和分类不能为空' })
  }

  const cats = await query<any[]>(`SELECT id FROM categories WHERE id = :id`, { id: categoryId })
  if (!cats.length) {
    throw createError({ statusCode: 400, statusMessage: '分类不存在' })
  }

  const id = createId('site')
  const description = body.description?.trim() || ''
  const status = body.status === 'hidden' ? 'hidden' : 'online'
  const isHot = body.hot ? 1 : 0
  const color = body.color?.trim() || '#1a1714'
  const letter = pickLetter(name, body.letter)
  const icon = body.icon?.trim() || ''

  await query(
    `INSERT INTO sites (id, name, description, url, category_id, status, is_hot, color, letter, icon)
     VALUES (:id, :name, :description, :url, :categoryId, :status, :isHot, :color, :letter, :icon)`,
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
