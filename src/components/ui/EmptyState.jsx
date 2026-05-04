export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="fg-empty-state" role="status" aria-live="polite">
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel ? (
        <button type="button" className="fg-home-new-btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
