import Skeleton from "react-loading-skeleton";
import "../../styles/sections/shimmerLoader.scss";

export default function EventsPaginationSkeleton() {
  return (
    <div className="shimmer-loader__events-pagination">
      <Skeleton width={40} height={40} circle />
      <Skeleton width={80} height={40} borderRadius={8} />
      <Skeleton width={40} height={40} circle />
    </div>
  );
}
