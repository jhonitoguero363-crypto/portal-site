export default defineEventHandler(async () => {
  const rows = await query<any[]>(`SELECT \`key\`, \`value\` FROM settings`)
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]))

  return {
    data: {
      siteName: map.site_name || '程序员导航网',
      siteUrl: map.site_url || '',
      allowSubmit: map.allow_submit === '1' || map.allow_submit === 'true'
    }
  }
})
