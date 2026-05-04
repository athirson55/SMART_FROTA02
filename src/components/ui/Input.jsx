import { forwardRef } from "react";

/**
 * Componente Input reutilizável com suporte a diferentes tipos.
 *
 * Props:
 *  - type: "text" | "email" | "password" | "number" | "date" | "tel" (default "text")
 *  - placeholder: string
 *  - value: string | number
 *  - onChange: (e: ChangeEvent) => void
 *  - label: string (opcional)
 *  - error: string (opcional - exibe mensagem de erro)
 *  - disabled: boolean (default false)
 *  - required: boolean (default false)
 *  - className: string (classes adicionais)
 *  - maxLength: number (opcional)
 *  - pattern: string (opcional - regex)
 *  - ...props: outras props padrão do input
 */
export const Input = forwardRef(
  (
    {
      type = "text",
      placeholder = "",
      value,
      onChange,
      label,
      error,
      disabled = false,
      required = false,
      className = "",
      maxLength,
      pattern,
      ...props
    },
    ref,
  ) => {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="fg-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="fg-input-label">
            {label}
            {required && <span className="fg-input-required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          className={`fg-ui-input ${error ? "fg-input-error" : ""} ${className}`.trim()}
          aria-label={label || placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="fg-input-error-message">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
