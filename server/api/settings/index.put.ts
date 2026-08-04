export default defineEventHandler(async (event) => {
  const body = await readBody<{
    siteName?: string
    siteUrl?: string
    allowSubmit?: boolean
  }>(event)

  const pairs: Array<[string, string]> = [
    ['site_name', body.siteName?.trim() || '程序员导航网'],
    ['site_url', body.siteUrl?.trim() || ''],
    ['allow_submit', body.allowSubmit === false ? '0' : '1']
  ]

  for (const [key, value] of pairs) {
    await query(
      `INSERT INTO settings (\`key\`, \`value\`) VALUES (:key, :value)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
      { key, value }
    )
  }

  return {
    data: {
      siteName: pairs[0][1],
      siteUrl: pairs[1][1],
      allowSubmit: pairs[2][1] === '1'
    }
  }
})
