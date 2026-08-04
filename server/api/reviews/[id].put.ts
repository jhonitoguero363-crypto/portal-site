import { createId } from '../../utils/db'
import { mapReview, pickLetter, type ReviewRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少审核 ID' })

  const body = await readBody<{
    status?: 'pending' | 'approved' | 'rejected'
    name?: string
    description?: string
    url?: string
    categoryId?: string
    submitter?: string
  }>(event)

  const existing = await query<ReviewRow[]>(`SELECT * FROM reviews WHERE id = :id`, { id })
  if (!existing.length) {
    throw createError({ statusCode: 404, statusMessage: '提交不存在' })
  }

  const current = existing[0]
  const status = body.status || current.status
  const name = body.name?.trim() || current.name
  const description = body.description !== undefined ? (body.description?.trim() || '') : current.description
  const url = body.url?.trim()?.replace(/^https?:\/\//, '') || current.url
  const submitter = body.submitter?.trim() || current.submitter
  let categoryId = body.categoryId !== undefined ? (body.categoryId || null) : current.category_id
  let categoryName = current.category_name

  if (body.categoryId) {
    const cats = await query<any[]>(`SELECT id, name FROM categories WHERE id = :id`, { id: body.categoryId })
    if (!cats.length) {
      throw createError({ statusCode: 400, statusMessage: '分类不存在' })
    }
    categoryId = cats[0].id
    categoryName = cats[0].name
  }

  await query(
    `UPDATE reviews
     SET name = :name,
         description = :description,
         url = :url,
         category_id = :categoryId,
         category_name = :categoryName,
         submitter = :submitter,
         status = :status
     WHERE id = :id`,
    { id, name, description, url, categoryId, categoryName, submitter, status }
  )

  // Approve: upsert into sites
  if (status === 'approved') {
    const siteId = createId('site')
    const letter = pickLetter(name, current.letter)
    const targetCategory = categoryId || 'other'

    const existSite = await query<any[]>(
      `SELECT id FROM sites WHERE url = :url OR url = :fullUrl LIMIT 1`,
      { url, fullUrl: `https://${url}` }
    )

    if (!existSite.length) {
      await query(
        `INSERT INTO sites (id, name, description, url, category_id, status, is_hot, color, letter, icon)
         VALUES (:id, :name, :description, :url, :categoryId, 'online', 0, :color, :letter, :icon)`,
        {
          id: siteId,
          name,
          description,
          url: url.startsWith('http') ? url : `https://${url}`,
          categoryId: targetCategory,
          color: current.color.startsWith('#') && current.color.length === 7 ? current.color : '#1a1714',
          letter,
          icon: current.icon || ''
        }
      )
    } else {
      await query(
        `UPDATE sites
         SET name = :name, description = :description, status = 'online', category_id = :categoryId, icon = :icon
         WHERE id = :id`,
        { id: existSite[0].id, name, description, categoryId: targetCategory, icon: current.icon || '' }
      )
    }
  }

  const rows = await query<ReviewRow[]>(`SELECT * FROM reviews WHERE id = :id`, { id })
  return { data: mapReview(rows[0]) }
})
