import EventsListSkeleton from "../components/events/EventsListSkeleton";
import EventsPaginationSkeleton from "../components/events/EventsPaginationSkeleton";

export default function EventsPageSkeleton() {
  return (
    <div className="events-page" style={{ padding: 30, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <div className="events-container" style={{ maxWidth: 1200, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        <div className="events-section" style={{ minWidth: "100%", display: "flex", flexDirection: "column", gap: 30, flex: 1 }}>
          <EventsListSkeleton count={6} />
        </div>
      </div>

      <EventsPaginationSkeleton />
    </div>
  );
}
