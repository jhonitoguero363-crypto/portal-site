export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少分类 ID' })

  const sites = await query<any[]>(
    `SELECT COUNT(*) AS count FROM sites WHERE category_id = :id`,
    { id }
  )
  if (Number(sites[0]?.count || 0) > 0) {
    throw createError({ statusCode: 400, statusMessage: '该分类下仍有站点，无法删除' })
  }

  const result = await query<any>(`DELETE FROM categories WHERE id = :id`, { id })
  if (!result.affectedRows) {
    throw createError({ statusCode: 404, statusMessage: '分类不存在' })
  }

  return { success: true }
})
