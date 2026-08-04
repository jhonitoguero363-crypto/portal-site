import { mapCategory, mapSite, type CategoryRow, type SiteRow } from '../../utils/mappers'

export default defineEventHandler(async () => {
  const categories = await query<CategoryRow[]>(`
    SELECT c.*, COUNT(s.id) AS site_count
    FROM categories c
    LEFT JOIN sites s ON s.category_id = c.id AND s.status = 'online'
    GROUP BY c.id
    HAVING site_count > 0
    ORDER BY c.sort_order ASC, c.name ASC
  `)

  const hotSites = await query<SiteRow[]>(`
    SELECT s.*, c.name AS category_name
    FROM sites s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'online' AND s.is_hot = 1
    ORDER BY s.updated_at DESC
    LIMIT 8
  `)

  const aiSites = await query<SiteRow[]>(`
    SELECT s.*, c.name AS category_name
    FROM sites s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'online' AND s.category_id = 'ai' AND s.is_hot = 0
    ORDER BY s.updated_at DESC
    LIMIT 9
  `)

  const ideSites = await query<SiteRow[]>(`
    SELECT s.*, c.name AS category_name
    FROM sites s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'online' AND s.category_id IN ('ide', 'devtools')
    ORDER BY s.updated_at DESC
    LIMIT 12
  `)

  const totals = await query<any[]>(`
    SELECT
      COUNT(*) AS total_sites,
      SUM(status = 'online') AS online_sites
    FROM sites
  `)

  const mappedCategories = categories.map(mapCategory)
  const allCount = Number(totals[0]?.online_sites || 0)

  return {
    data: {
      stats: {
        totalSites: Number(totals[0]?.total_sites || 0),
        onlineSites: allCount,
        categoryCount: categories.length
      },
      categories: [
        { id: 'all', name: '全部网站', sortOrder: 0, count: allCount },
        ...mappedCategories
      ],
      hotSites: hotSites.map(mapSite),
      aiSites: aiSites.map(mapSite),
      ideSites: ideSites.map(mapSite)
    }
  }
})
