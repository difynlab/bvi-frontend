import React from 'react'

const NewsletterCardShimmerMobile = () => {
  return (
    <div className="newsletter-card-skeleton-mobile">
      {/* Text Content Area (Top Section) */}
      <div className="newsletter-card-skeleton-mobile__text-content">
        {/* Main Title Placeholder */}
        <div className="newsletter-card-skeleton-mobile__title"></div>
        
        {/* Subtitle Placeholder */}
        <div className="newsletter-card-skeleton-mobile__subtitle"></div>
        
        {/* Published Date Placeholder */}
        <div className="newsletter-card-skeleton-mobile__date"></div>
      </div>
      
      {/* Action Buttons Area (Bottom Section) */}
      <div className="newsletter-card-skeleton-mobile__actions">
        {/* Left Button Placeholder (Icon-only) */}
        <div className="newsletter-card-skeleton-mobile__button-left"></div>
        
        {/* Middle Button Placeholder (Text button) */}
        <div className="newsletter-card-skeleton-mobile__button-middle"></div>
        
        {/* Right Button Placeholder (Icon-only, darker) */}
        <div className="newsletter-card-skeleton-mobile__button-right"></div>
      </div>
    </div>
  )
}

export default NewsletterCardShimmerMobile
