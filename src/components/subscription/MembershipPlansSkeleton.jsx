import React from 'react';
import '../../styles/components/MembershipPlansSkeleton.scss';

const PLACEHOLDER_COUNT = 3;

const MembershipPlansSkeleton = ({ cards = PLACEHOLDER_COUNT, className = '' }) => {
  const placeholders = Array.from({ length: cards });

  return (
    <div className={`membership-plans-skeleton ${className}`.trim()}>
      {placeholders.map((_, index) => (
        <div key={index} className="membership-plans-skeleton__card">
          <div className="membership-plans-skeleton__header">
            <div className="membership-plans-skeleton__title membership-plans-skeleton__shimmer" />
            <div className="membership-plans-skeleton__action membership-plans-skeleton__shimmer" />
          </div>

          <div className="membership-plans-skeleton__section">
            <div className="membership-plans-skeleton__label membership-plans-skeleton__shimmer" />
            <div className="membership-plans-skeleton__line membership-plans-skeleton__shimmer" />
            <div className="membership-plans-skeleton__line membership-plans-skeleton__line--short membership-plans-skeleton__shimmer" />
          </div>

          <div className="membership-plans-skeleton__section">
            <div className="membership-plans-skeleton__label membership-plans-skeleton__shimmer" />
            <div className="membership-plans-skeleton__line membership-plans-skeleton__shimmer" />
            <div className="membership-plans-skeleton__line membership-plans-skeleton__line--short membership-plans-skeleton__shimmer" />
          </div>

          <div className="membership-plans-skeleton__section membership-plans-skeleton__section--perks">
            <div className="membership-plans-skeleton__label membership-plans-skeleton__shimmer" />
            <ul className="membership-plans-skeleton__perks">
              {Array.from({ length: 4 }).map((__, perkIndex) => (
                <li key={perkIndex} className="membership-plans-skeleton__perk">
                  <span className="membership-plans-skeleton__perk-icon membership-plans-skeleton__shimmer" />
                  <span className="membership-plans-skeleton__perk-line membership-plans-skeleton__shimmer" />
                </li>
              ))}
            </ul>
          </div>

          <div className="membership-plans-skeleton__footer">
            <div className="membership-plans-skeleton__button membership-plans-skeleton__shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MembershipPlansSkeleton;

