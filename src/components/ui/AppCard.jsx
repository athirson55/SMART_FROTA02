export function AppCard({ className = "", children, ...props }) {
  return (
    <article className={`fg-ui-card ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}
