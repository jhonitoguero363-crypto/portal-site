import { createId } from '../../utils/db'
import { mapReview, pickLetter, type ReviewRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    description?: string
    url?: string
    categoryId?: string
    category?: string
    submitter?: string
    color?: string
    letter?: string
    icon?: string
  }>(event)

  const name = body.name?.trim()
  const url = body.url?.trim()?.replace(/^https?:\/\//, '')
  if (!name || !url) {
    throw createError({ statusCode: 400, statusMessage: '名称和链接不能为空' })
  }

  let categoryId = body.categoryId?.trim() || null
  let categoryName = body.category?.trim() || ''

  if (categoryId) {
    const cats = await query<any[]>(`SELECT id, name FROM categories WHERE id = :id`, { id: categoryId })
    if (!cats.length) {
      throw createError({ statusCode: 400, statusMessage: '分类不存在' })
    }
    categoryName = cats[0].name
  }

  const id = createId('rev')
  const description = body.description?.trim() || ''
  const submitter = body.submitter?.trim() || '匿名'
  const color = body.color?.trim() || '#e5e7eb'
  const letter = pickLetter(name, body.letter)
  const icon = body.icon?.trim() || ''

  await query(
    `INSERT INTO reviews (id, name, description, url, category_id, category_name, submitter, status, color, letter, icon)
     VALUES (:id, :name, :description, :url, :categoryId, :categoryName, :submitter, 'pending', :color, :letter, :icon)`,
    { id, name, description, url, categoryId, categoryName, submitter, color, letter, icon }
  )

  const rows = await query<ReviewRow[]>(`SELECT * FROM reviews WHERE id = :id`, { id })
  return { data: mapReview(rows[0]) }
})
