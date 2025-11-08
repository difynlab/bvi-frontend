import React from 'react';
import '../../styles/components/ImportantInfoSkeleton.scss';

const cards = [
  { key: 'eligibility' },
  { key: 'benefits' },
  { key: 'payment' }
];

const ImportantInfoSkeleton = ({ className = '' }) => {
  return (
    <div className={`important-info-skeleton ${className}`.trim()}>
      {cards.map((card) => (
        <div key={card.key} className="important-info-skeleton__card">
          <div className="important-info-skeleton__icon shimmer" />
          <div className="important-info-skeleton__title shimmer" />
          <div className="important-info-skeleton__text shimmer" />
          <div className="important-info-skeleton__text shimmer important-info-skeleton__text--short" />
          <div className="important-info-skeleton__link shimmer" />
        </div>
      ))}
    </div>
  );
};

export default ImportantInfoSkeleton;

