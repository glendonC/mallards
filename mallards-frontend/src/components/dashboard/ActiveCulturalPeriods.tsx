import { useEffect, useState } from "react";
import { CulturalPeriodsData, CulturalPeriod } from "../../types/dashboard";

const PAGE_SIZE = 10;

const ActiveCulturalPeriods = ({ 
  data, 
  isPreview, 
  isFocused, 
  customColors 
}: { 
  data?: CulturalPeriodsData | null,
  isPreview: boolean, 
  isFocused: boolean, 
  customColors?: any
}) => {
  const [periodData, setPeriodData] = useState(data ?? null);
  const [activeExpanded, setActiveExpanded] = useState(false);
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState(PAGE_SIZE);

  useEffect(() => {
    if (data) setPeriodData(data);
  }, [data]);

  const renderEventCard = (event: CulturalPeriod) => (
    <div key={event.id} className="p-4 border rounded-lg">
      <h4 className="font-medium">{event.name} {event.aiGenerated ? "(AI Predicted)" : ""}</h4>
      <p className="text-sm text-gray-500">{event.startDate} – {event.endDate}</p>
      <p className="text-sm text-gray-500">
        Expected change: {event.impact.expectedChange?.toFixed(2) ?? 0}%
      </p>
      <span className="text-red-500 font-semibold">{event.impact.level.toUpperCase()}</span>
    </div>
  );

  if (isPreview) {
    const firstActive = periodData?.active?.[0];
    const firstUpcoming = periodData?.upcoming?.[0];
  
    return (
      <div className="p-4">
        {firstActive ? (
          <div>
            <h4 className="font-medium">{firstActive.name}</h4>
            <p className="text-sm text-gray-500">
              {firstActive.startDate} – {firstActive.endDate}
            </p>
            <span className="text-red-500 font-semibold">
              {firstActive.impact.level.toUpperCase()}
            </span>
          </div>
        ) : firstUpcoming ? (
          <div>
            <h4 className="font-medium">{firstUpcoming.name} (AI Predicted)</h4>
            <p className="text-sm text-gray-500">
              {firstUpcoming.startDate} – {firstUpcoming.endDate}
            </p>
            <span className="text-red-500 font-semibold">
              {firstUpcoming.impact.level.toUpperCase()}
            </span>
            <p className="text-sm text-gray-500">
              Expected change: {firstUpcoming.impact.expectedChange?.toFixed(2) ?? 0}%
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No active or predicted cultural periods.</p>
        )}
      </div>
    );
  }
  

  if (isFocused) {
    return (
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-semibold" style={{ color: customColors?.textColor }}>
          Cultural Periods (Detailed View)
        </h3>

        {/* 🔻 Expandable Active Events */}
        <div>
          <button
            className="w-full text-left p-2 font-medium border-b"
            onClick={() => setActiveExpanded(!activeExpanded)}
          >
            {activeExpanded ? "▼" : "▶"} Active Events ({periodData?.active.length})
          </button>
          {activeExpanded && (
            <div className="space-y-4">
              {(periodData?.active?.length ?? 0) > 0 ? 
              periodData?.active.map(renderEventCard) : 
              <p className="text-gray-500">No active cultural periods.</p>}
            </div>
          )}
        </div>

        {/* 🔻 Expandable AI Predicted Events with Pagination */}
        <div>
          <button
            className="w-full text-left p-2 font-medium border-b"
            onClick={() => setUpcomingExpanded(!upcomingExpanded)}
          >
            {upcomingExpanded ? "▼" : "▶"} AI Predicted Events ({periodData?.upcoming?.length})
          </button>
          {upcomingExpanded && (
            <div className="space-y-4">
              {periodData?.upcoming.slice(0, visibleEvents).map(renderEventCard)}

              {/* ✅ Load More Button */}
              {visibleEvents < (periodData?.upcoming?.length ?? 0) && (
                <button
                  className="mt-4 w-full bg-gray-200 p-2 rounded-lg"
                  onClick={() => setVisibleEvents((prev) => prev + PAGE_SIZE)}
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </div>

        {/* ✅ Historical Insights */}
        {periodData?.historical && (
          <div className="mt-6 p-4 rounded-lg border">
            <h4 className="font-medium">Historical Insights</h4>
            <p className="text-sm opacity-75">Total Events: {periodData.impactMetrics.totalEvents}</p>
            <p className="text-sm opacity-75">High Impact Events: {periodData.impactMetrics.highImpact}</p>
            <p className="text-sm opacity-75">Average Change: {periodData.impactMetrics.averageChange.toFixed(2)}%</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ActiveCulturalPeriods;
