export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少站点 ID' })

  const result = await query<any>(`DELETE FROM sites WHERE id = :id`, { id })
  if (!result.affectedRows) {
    throw createError({ statusCode: 404, statusMessage: '站点不存在' })
  }

  return { success: true }
})
