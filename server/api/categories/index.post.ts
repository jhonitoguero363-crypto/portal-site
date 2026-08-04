import { mapCategory, type CategoryRow } from '../../utils/mappers'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: string, name?: string, sortOrder?: number }>(event)
  const id = body.id?.trim()
  const name = body.name?.trim()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '分类 ID 不能为空' })
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: '分类 ID 需以字母开头，仅含字母、数字、下划线或短横线'
    })
  }
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '分类名称不能为空' })
  }

  const existed = await query<any[]>(
    `SELECT id FROM categories WHERE id = :id LIMIT 1`,
    { id }
  )
  if (existed.length) {
    throw createError({ statusCode: 400, statusMessage: '分类 ID 已存在' })
  }

  const sortOrder = Number(body.sortOrder ?? 99)

  await query(
    `INSERT INTO categories (id, name, sort_order) VALUES (:id, :name, :sortOrder)`,
    { id, name, sortOrder }
  )

  const rows = await query<CategoryRow[]>(
    `SELECT c.*, 0 AS site_count FROM categories c WHERE c.id = :id`,
    { id }
  )

  return { data: mapCategory(rows[0]) }
})
