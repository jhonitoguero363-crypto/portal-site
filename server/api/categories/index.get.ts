import { mapCategory, type CategoryRow } from '../../utils/mappers'

export default defineEventHandler(async () => {
  const rows = await query<CategoryRow[]>(`
    SELECT c.*, COUNT(s.id) AS site_count
    FROM categories c
    LEFT JOIN sites s ON s.category_id = c.id AND s.status = 'online'
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `)

  return {
    data: rows.map(mapCategory)
  }
})
