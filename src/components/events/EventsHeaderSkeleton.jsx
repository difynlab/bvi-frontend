import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../../styles/sections/shimmerLoader.scss";

export default function EventsHeaderSkeleton() {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="shimmer-loader__events-header">
        <div className="shimmer-loader__events-header-title">
          <Skeleton width={240} height={26} />
          <Skeleton width={320} height={16} />
        </div>

        <div className="shimmer-loader__events-header-actions">
          <Skeleton width={110} height={40} borderRadius={8} />
          <Skeleton width={40} height={40} circle />
        </div>
      </div>
    </SkeletonTheme>
  );
}
