import React from 'react'
import ReportCardShimmer from './ReportCardShimmer'

const ReportsListShimmer = () => {
  return (
    <div className="reports-list-skeleton">
      <ReportCardShimmer />
      <ReportCardShimmer />
      <ReportCardShimmer />
    </div>
  )
}

export default ReportsListShimmer
