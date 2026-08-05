export default defineEventHandler(async (event) => {
  deleteCookie(event, 'portal_admin', {
    path: '/'
  })

  return { ok: true }
})
