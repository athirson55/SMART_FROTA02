export function TableRow({
  className = "",
  onClick,
  onKeyDown,
  children,
  tabIndex = -1,
}) {
  return (
    <tr
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
    >
      {children}
    </tr>
  );
}
