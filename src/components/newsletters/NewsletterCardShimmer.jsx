import React from 'react'

const NewsletterCardShimmer = () => {
  return (
    <div className="newsletter-card-skeleton">
      {/* Newsletter Card: Horizontal layout with content on left, actions on right */}
      <div className="newsletter-card-skeleton__content">
        {/* Left side: Title, Description, Date */}
        <div className="newsletter-card-skeleton__left">
          <div className="newsletter-card-skeleton__title-line"></div>
          <div className="newsletter-card-skeleton__description-line newsletter-card-skeleton__description-line--short"></div>
          <div className="newsletter-card-skeleton__description-line newsletter-card-skeleton__description-line--medium"></div>
          <div className="newsletter-card-skeleton__date-line"></div>
        </div>
        
        {/* Right side: 3 Action buttons */}
        <div className="newsletter-card-skeleton__right">
          <div className="newsletter-card-skeleton__button-small"></div>
          <div className="newsletter-card-skeleton__button-medium"></div>
          <div className="newsletter-card-skeleton__button-large"></div>
        </div>
      </div>
    </div>
  )
}

export default NewsletterCardShimmer
