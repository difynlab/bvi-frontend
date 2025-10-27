import React from 'react'

const ReportCardShimmer = () => {
  return (
    <div className="report-card-skeleton">
      {/* Report Info Section (Left Side) */}
      <div className="report-card-skeleton__info">
        {/* Published Date */}
        <div className="report-card-skeleton__date"></div>
        
        {/* Report Title */}
        <div className="report-card-skeleton__title"></div>
      </div>
      
      {/* Action Buttons Section (Right Side) */}
      <div className="report-card-skeleton__actions">
        {/* Delete Button */}
        <div className="report-card-skeleton__button report-card-skeleton__button--delete"></div>
        
        {/* Edit Button */}
        <div className="report-card-skeleton__button report-card-skeleton__button--edit"></div>
        
        {/* Download Button */}
        <div className="report-card-skeleton__button report-card-skeleton__button--download"></div>
      </div>
    </div>
  )
}

export default ReportCardShimmer
