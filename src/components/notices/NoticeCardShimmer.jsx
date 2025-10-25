import React from 'react'

const NoticeCardShimmer = () => {
  return (
    <div className="notice-card-skeleton">
      {/* 1. Notice Header: Title + Description + 3 Buttons */}
      <div className="notice-card-skeleton__header">
        <div className="notice-card-skeleton__header-left">
          <div className="notice-card-skeleton__title-line notice-card-skeleton__title-line--long"></div>
          <div className="notice-card-skeleton__description-line notice-card-skeleton__description-line--short"></div>
        </div>
        <div className="notice-card-skeleton__header-right">
          <div className="notice-card-skeleton__button-small"></div>
          <div className="notice-card-skeleton__button-medium"></div>
          <div className="notice-card-skeleton__button-large"></div>
        </div>
      </div>
      
      {/* 2. Notice Image */}
      <div className="notice-card-skeleton__image">
        <div className="notice-card-skeleton__shimmer"></div>
      </div>
      
      {/* 3. Publication Date */}
      <div className="notice-card-skeleton__date">
        <div className="notice-card-skeleton__date-line"></div>
      </div>
    </div>
  )
}

export default NoticeCardShimmer
