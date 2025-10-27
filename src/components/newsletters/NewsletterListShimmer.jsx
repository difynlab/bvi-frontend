import React from 'react'
import NewsletterCardShimmer from './NewsletterCardShimmer'
import NewsletterCardShimmerMobile from './NewsletterCardShimmerMobile'

const NewsletterListShimmer = () => {
  return (
    <div className="newsletters-list-skeleton">
      {/* Desktop skeleton */}
      <NewsletterCardShimmer />
      <NewsletterCardShimmer />
      <NewsletterCardShimmer />
      
      {/* Mobile skeleton */}
      <NewsletterCardShimmerMobile />
      <NewsletterCardShimmerMobile />
      <NewsletterCardShimmerMobile />
    </div>
  )
}

export default NewsletterListShimmer
