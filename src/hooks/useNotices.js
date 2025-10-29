import { useState, useEffect, useCallback } from 'react'
import noticesService from '../services/noticesService'
import { transformFromBackend } from '../utils/noticeTransformers'

const sortNoticesByDate = (notices) => {
  return notices.sort((a, b) => {
    // Priority: createdAtMs → updatedAtMs → createdAt
    const getDateA = (notice) => {
      if (notice.createdAtMs) return notice.createdAtMs
      if (notice.updatedAtMs) return notice.updatedAtMs
      if (notice.createdAt) {
        try {
          const date = new Date(`${notice.createdAt}T00:00:00`)
          return isNaN(date.getTime()) ? 0 : date.getTime()
        } catch {
          return 0
        }
      }
      return 0
    }
    
    const dateA = getDateA(a)
    const dateB = getDateA(b)
    return dateB - dateA // Descending order (newest first)
  })
}

export const useNotices = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadNotices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await noticesService.getNotices()
      
      if (response.http_status === 200 && response.data) {
        const transformedNotices = response.data.data.map(transformFromBackend)
        const sortedNotices = sortNoticesByDate(transformedNotices)
        setNotices(sortedNotices)
      } else if (response.http_status === 404) {
        setNotices([])
      }
    } catch (err) {
      if (err.message.includes('No notices found')) {
        setNotices([])
      } else {
        console.error('Error loading notices:', err)
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotices()
  }, [loadNotices])

  return {
    notices,
    loading,
    error,
    loadNotices
  }
}
