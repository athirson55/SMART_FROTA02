export function AppButton({
  type = "button",
  className = "",
  onClick,
  children,
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={`fg-ui-button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
