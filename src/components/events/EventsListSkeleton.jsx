import EventCardSkeleton from "./EventCardSkeleton";
import "../../styles/sections/shimmerLoader.scss";

export default function EventsListSkeleton({ count = 6 }) {
  return (
    <div className="shimmer-loader__events-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-loader__events-list-item">
          <EventCardSkeleton />
        </div>
      ))}
    </div>
  );
}
