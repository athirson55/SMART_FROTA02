import { useEffect } from "react";

export function QuickInfoModal({
  isOpen,
  title,
  items,
  onClose,
  onViewMore,
  viewMoreLabel = "Ver mais detalhes",
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fg-quick-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section className="fg-quick-modal" role="dialog" aria-modal="true">
        <header className="fg-quick-modal-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="fg-quick-modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </header>

        <ul className="fg-quick-modal-list">
          {(items ?? []).length === 0 ? (
            <li>
              <strong>Sem itens para exibir</strong>
              <p>Use o botão abaixo para abrir a visualização completa.</p>
            </li>
          ) : null}

          {(items ?? []).map((item, index) => {
            const normalizedItem =
              typeof item === "string"
                ? { title: item, subtitle: "" }
                : {
                    id: item.id,
                    title: item.title,
                    subtitle: item.subtitle ?? "",
                  };

            const itemKey =
              normalizedItem.id ?? `${normalizedItem.title}-${index}`;

            return (
              <li key={itemKey}>
                <strong>{normalizedItem.title}</strong>
                {normalizedItem.subtitle ? (
                  <p>{normalizedItem.subtitle}</p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <footer className="fg-quick-modal-foot">
          <button
            type="button"
            className="fg-home-new-btn"
            onClick={onViewMore}
          >
            {viewMoreLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
