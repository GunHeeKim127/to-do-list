export function LoadingState({ label = "데이터를 불러오는 중...", compact = false }: { label?: string; compact?: boolean }) {
  return <div className={`component-loading ${compact ? "compact" : "glass-card"}`} role="status" aria-live="polite">
    <span className="loading-spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}
