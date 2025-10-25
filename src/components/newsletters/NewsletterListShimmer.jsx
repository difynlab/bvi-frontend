import React from 'react'
import NewsletterCardShimmer from './NewsletterCardShimmer'

const NewsletterListShimmer = () => {
  return (
    <div className="newsletters-list-skeleton">
      <NewsletterCardShimmer />
      <NewsletterCardShimmer />
      <NewsletterCardShimmer />
    </div>
  )
}

export default NewsletterListShimmer
