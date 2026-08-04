import { formatDateTime } from './db'
import { resolveIconUrl } from './cos'

export interface CategoryRow {
  id: string
  name: string
  sort_order: number
  site_count?: number
}

export interface SiteRow {
  id: string
  name: string
  description: string
  url: string
  category_id: string
  category_name?: string
  status: 'online' | 'hidden'
  is_hot: number
  color: string
  letter: string
  icon: string
  updated_at: string
}

export interface ReviewRow {
  id: string
  name: string
  description: string
  url: string
  category_id: string | null
  category_name: string
  submitter: string
  status: 'pending' | 'approved' | 'rejected'
  color: string
  letter: string
  icon: string
  created_at: string
}

export function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    count: Number(row.site_count || 0)
  }
}

export function mapSite(row: SiteRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    categoryId: row.category_id,
    category: row.category_name || '',
    status: row.status,
    hot: Boolean(row.is_hot),
    color: row.color,
    letter: row.letter,
    icon: resolveIconUrl(row.icon),
    updatedAt: formatDateTime(row.updated_at)
  }
}

export function mapReview(row: ReviewRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    categoryId: row.category_id,
    category: row.category_name,
    submitter: row.submitter,
    status: row.status,
    color: row.color,
    letter: row.letter,
    icon: resolveIconUrl(row.icon),
    submittedAt: formatDateTime(row.created_at)
  }
}

export function pickLetter(name: string, letter?: string) {
  if (letter?.trim()) return letter.trim().slice(0, 8)
  return (name.trim()[0] || '?').toUpperCase()
}
