import React from 'react';
import '../../styles/components/ExpertFirmsList.scss';

const ExpertFirmsSkeleton = () => {
  const skeletonItems = Array.from({ length: 6 });

  return (
    <div className="expert-firms-list expert-firms-list--skeleton">
      {skeletonItems.map((_, index) => (
        <div key={`expert-firm-skeleton-${index}`} className="expert-firm-card-skeleton">
          <div className="expert-firm-card-skeleton__header shimmer-block" />

          <div className="expert-firm-card-skeleton__body">
            <div className="expert-firm-card-skeleton__top-row">
              <span className="expert-firm-card-skeleton__pill shimmer-block" />
              <span className="expert-firm-card-skeleton__pill expert-firm-card-skeleton__pill--small shimmer-block" />
            </div>

            <div className="expert-firm-card-skeleton__line expert-firm-card-skeleton__line--title shimmer-block" />
            <div className="expert-firm-card-skeleton__line shimmer-block" />
            <div className="expert-firm-card-skeleton__line shimmer-block" />

            <div className="expert-firm-card-skeleton__contact">
              <span className="expert-firm-card-skeleton__contact-line shimmer-block" />
              <span className="expert-firm-card-skeleton__contact-line shimmer-block" />
            </div>

            <div className="expert-firm-card-skeleton__button shimmer-block" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpertFirmsSkeleton;

