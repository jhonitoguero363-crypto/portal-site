export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少审核 ID' })

  const result = await query<any>(`DELETE FROM reviews WHERE id = :id`, { id })
  if (!result.affectedRows) {
    throw createError({ statusCode: 404, statusMessage: '提交不存在' })
  }

  return { success: true }
})
