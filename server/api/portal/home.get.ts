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

  const allSites = await query<SiteRow[]>(`
    SELECT s.*, c.name AS category_name
    FROM sites s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'online'
    ORDER BY c.sort_order ASC, c.name ASC, s.is_hot DESC, s.updated_at DESC
  `)

  const hotSites = allSites.filter(s => Number(s.is_hot) === 1).slice(0, 8)

  const totals = await query<any[]>(`
    SELECT
      COUNT(*) AS total_sites,
      SUM(status = 'online') AS online_sites
    FROM sites
  `)

  const mappedCategories = categories.map(mapCategory)
  const allCount = Number(totals[0]?.online_sites || 0)

  const sitesByCategory = new Map<string, ReturnType<typeof mapSite>[]>()
  for (const row of allSites) {
    const site = mapSite(row)
    const list = sitesByCategory.get(site.categoryId) || []
    list.push(site)
    sitesByCategory.set(site.categoryId, list)
  }

  const sections = mappedCategories.map(cat => ({
    category: cat,
    sites: sitesByCategory.get(cat.id) || []
  }))

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
      sections
    }
  }
})
