import React from 'react'

const ReportCardShimmerMobile = () => {
  return (
    <div className="report-card-skeleton-mobile">
      {/* Report Info Section */}
      <div className="report-card-skeleton-mobile__info">
        {/* Published Date */}
        <div className="report-card-skeleton-mobile__date"></div>
        
        {/* Report Title */}
        <div className="report-card-skeleton-mobile__title"></div>
      </div>
      
      {/* Action Buttons Section */}
      <div className="report-card-skeleton-mobile__actions">
        {/* Delete Button */}
        <div className="report-card-skeleton-mobile__button report-card-skeleton-mobile__button--delete"></div>
        
        {/* Edit Button */}
        <div className="report-card-skeleton-mobile__button report-card-skeleton-mobile__button--edit"></div>
        
        {/* Download Button */}
        <div className="report-card-skeleton-mobile__button report-card-skeleton-mobile__button--download"></div>
      </div>
    </div>
  )
}

export default ReportCardShimmerMobile
