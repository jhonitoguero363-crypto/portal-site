export type SiteStatus = 'online' | 'hidden'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Category {
  id: string
  name: string
  sortOrder?: number
  count: number
}

export interface Site {
  id: string
  name: string
  description: string
  url: string
  category: string
  categoryId: string
  status: SiteStatus
  updatedAt: string
  hot?: boolean
  color: string
  letter: string
  icon?: string
}

export interface ReviewItem {
  id: string
  name: string
  description: string
  url: string
  category: string
  categoryId?: string | null
  submitter: string
  submittedAt: string
  status: ReviewStatus
  color: string
  letter: string
  icon?: string
}

