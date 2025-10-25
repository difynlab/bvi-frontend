import React from 'react'
import NoticeCardShimmer from './NoticeCardShimmer'

const NoticesListShimmer = () => {
  return (
    <div className="notices-list-skeleton">
      <NoticeCardShimmer />
      <NoticeCardShimmer />
      <NoticeCardShimmer />
    </div>
  )
}

export default NoticesListShimmer
