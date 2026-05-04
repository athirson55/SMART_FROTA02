import { useRef } from "react";

/**
 * Componente SearchInput - Input especializado para busca/filtro com ícone
 *
 * Props:
 *  - value: string
 *  - onChange: (query: string) => void
 *  - onClear: () => void (opcional)
 *  - placeholder: string (default "Buscar...")
 *  - disabled: boolean (default false)
 *  - className: string (classes adicionais)
 *  - debounce: number (ms para debounce, default 300)
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Buscar...",
  disabled = false,
  className = "",
  debounce = 300,
}) {
  const timeoutRef = useRef(null);

  const handleChange = (e) => {
    const newValue = e.target.value;

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Aplicar debounce
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounce);
  };

  const handleClear = () => {
    onChange("");
    if (onClear) onClear();
  };

  return (
    <div className={`fg-search-input-wrapper ${className}`.trim()}>
      <span className="fg-search-icon" aria-hidden="true">
        🔍
      </span>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="fg-ui-input fg-search-input"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="fg-search-clear-btn"
          onClick={handleClear}
          aria-label="Limpar busca"
          title="Limpar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
