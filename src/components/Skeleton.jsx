/**
 * Skeleton loading placeholders.
 * Use <Skeleton.Card /> for widget-sized blocks,
 * <Skeleton.Line /> for text lines.
 */

export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return (
    <div
      className="skeleton-pulse rounded"
      style={{ width, height, background: 'var(--border)', ...style }}
    />
  );
}

export function SkeletonCard({ height = 120, children, style = {} }) {
  return (
    <div
      className="widget-card rounded-xl p-4"
      style={{
        minHeight: height,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        ...style,
      }}
    >
      {children || (
        <div className="flex flex-col gap-3">
          <SkeletonLine width="40%" height={16} />
          <SkeletonLine width="70%" />
          <SkeletonLine width="55%" />
        </div>
      )}
    </div>
  );
}

export function SkeletonWidget() {
  return (
    <SkeletonCard height={140}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="skeleton-pulse rounded-full" style={{ width: 24, height: 24, background: 'var(--border)' }} />
          <SkeletonLine width="30%" height={16} />
        </div>
        <SkeletonLine width="80%" />
        <SkeletonLine width="60%" />
        <SkeletonLine width="45%" />
      </div>
    </SkeletonCard>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Greeting skeleton */}
      <div className="flex flex-col gap-2 pt-2">
        <SkeletonLine width="120px" height={12} />
        <SkeletonLine width="280px" height={28} />
        <SkeletonLine width="200px" height={14} />
      </div>
      {/* Widget grid skeleton */}
      <div className="widget-grid">
        <SkeletonWidget />
        <SkeletonWidget />
        <SkeletonWidget />
        <SkeletonWidget />
      </div>
    </div>
  );
}
