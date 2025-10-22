import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../../styles/sections/shimmerLoader.scss";

export default function EventCardSkeleton() {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="shimmer-loader__event-card">
        <div className="shimmer-loader__event-image">
          <Skeleton height={150} />
        </div>

        <div className="shimmer-loader__event-content">
          <div className="shimmer-loader__event-header">
            <Skeleton width={80} height={24} borderRadius={20} />
            <Skeleton width={70} height={14} />
          </div>

          <div className="shimmer-loader__event-title-container">
            <Skeleton width="100%" height={14} />
          </div>

          <div className="shimmer-loader__event-description">
            <Skeleton height={12} className="shimmer-loader__event-description-line" />
            <Skeleton height={12} width="100%" />
          </div>

          <div className="shimmer-loader__event-details">
            <div className="shimmer-loader__event-time">
              <Skeleton width={14} height={14} circle className="shimmer-loader__event-icon" />
              <Skeleton width="100%" height={12} />
            </div>
            <div className="shimmer-loader__event-location">
              <Skeleton width={14} height={14} circle className="shimmer-loader__event-icon" />
              <Skeleton width="100%" height={12} />
            </div>
          </div>

          <div className="shimmer-loader__event-actions">
            <Skeleton height={40} className="shimmer-loader__event-action-primary" borderRadius={6} />
            <Skeleton width={310} height={40} borderRadius={8} />
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
