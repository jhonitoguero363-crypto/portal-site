export default defineEventHandler(async (event) => {
  const body = await readBody<{ account?: string, password?: string }>(event)
  const account = body.account?.trim()
  const password = body.password ?? ''

  if (!account || !password) {
    throw createError({ statusCode: 400, statusMessage: '账号和密码不能为空' })
  }

  const rows = await query<any[]>(
    `SELECT id, account, display_name FROM admins WHERE account = :account AND password = :password LIMIT 1`,
    { account, password }
  )

  if (!rows.length) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  const admin = rows[0]
  setCookie(event, 'portal_admin', String(admin.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  return {
    data: {
      id: admin.id,
      account: admin.account,
      displayName: admin.display_name
    }
  }
})
