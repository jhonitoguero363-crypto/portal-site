import { resolveIconUrl } from '../utils/cos'

export default defineEventHandler(async () => {
  const siteStats = await query<any[]>(`
    SELECT
      COUNT(*) AS total_sites,
      SUM(status = 'online') AS online_sites
    FROM sites
  `)

  const pending = await query<any[]>(`
    SELECT COUNT(*) AS pending_count FROM reviews WHERE status = 'pending'
  `)

  const categories = await query<any[]>(`SELECT COUNT(*) AS total FROM categories`)

  const popular = await query<any[]>(`
    SELECT s.*, c.name AS category_name
    FROM sites s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'online'
    ORDER BY s.is_hot DESC, s.updated_at DESC
    LIMIT 6
  `)

  const totalSites = Number(siteStats[0]?.total_sites || 0)
  const onlineSites = Number(siteStats[0]?.online_sites || 0)
  const pendingCount = Number(pending[0]?.pending_count || 0)
  const categoryCount = Number(categories[0]?.total || 0)

  return {
    data: {
      stats: [
        { label: '收录站点', value: String(totalSites), delta: `${categoryCount} 个分类`, icon: 'i-lucide-globe' },
        { label: '待审核', value: String(pendingCount), delta: pendingCount ? '需处理' : '已清空', icon: 'i-lucide-inbox' },
        {
          label: '在线站点',
          value: String(onlineSites),
          delta: totalSites ? `${Math.round((onlineSites / totalSites) * 100)}%` : '0%',
          icon: 'i-lucide-activity'
        },
        { label: '分类数量', value: String(categoryCount), delta: '导航结构', icon: 'i-lucide-tags' }
      ],
      popularSites: popular.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category_name || '',
        color: row.color,
        letter: row.letter,
        icon: resolveIconUrl(row.icon)
      })),
      summary: {
        totalSites,
        onlineSites,
        pendingCount,
        categoryCount
      }
    }
  }
})
