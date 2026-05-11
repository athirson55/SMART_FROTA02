import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../services/auth";
import truckImage from "../assets/caminhao.avif";

const PASSWORD_RULES = [
  { key: "length", label: "Mínimo 8 caracteres", test: (s) => s.length >= 8 },
  {
    key: "upper",
    label: "Letra maiúscula (A-Z)",
    test: (s) => /[A-Z]/.test(s),
  },
  {
    key: "lower",
    label: "Letra minúscula (a-z)",
    test: (s) => /[a-z]/.test(s),
  },
  { key: "number", label: "Número (0-9)", test: (s) => /[0-9]/.test(s) },
  {
    key: "special",
    label: "Caractere especial (!@#$...)",
    test: (s) => /[^A-Za-z0-9]/.test(s),
  },
];

function getPasswordStrength(password) {
  if (!password) return { score: 0, passed: [] };
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).map(
    (rule) => rule.key,
  );
  return { score: passed.length, passed };
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const { score, passed } = useMemo(
    () => getPasswordStrength(novaSenha),
    [novaSenha],
  );
  const senhaForte = score === PASSWORD_RULES.length;
  const senhasIguais = confirmar.length > 0 && novaSenha === confirmar;

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!token) {
      setFeedback({
        type: "error",
        text: "Link inválido. Solicite um novo link de recuperação.",
      });
      return;
    }
    if (!senhaForte) {
      setFeedback({
        type: "error",
        text: "A senha deve atender a todos os requisitos de segurança.",
      });
      return;
    }
    if (novaSenha !== confirmar) {
      setFeedback({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordRequest({ token, novaSenha });
      navigate("/senha-redefinida");
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Token inválido ou expirado. Solicite um novo link.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="recovery-screen">
      <section className="recovery-screen__visual" aria-hidden="true">
        <img src={truckImage} alt="" />
      </section>
      <section className="recovery-screen__form-section">
        <form className="recovery-card" onSubmit={handleSubmit} noValidate>
          <div className="recovery-card__brand">
            <h1>SMART FROTA</h1>
            <p>SOLUÇÕES EM FROTA</p>
          </div>
          <p className="recovery-card__heading">Redefinir Senha</p>
          <p className="recovery-card__description">
            Digite e confirme a nova senha para sua conta
          </p>

          <label className="recovery-field-group" htmlFor="novaSenha">
            <span className="recovery-field-group__label">NOVA SENHA</span>
            <input
              id="novaSenha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              autoComplete="new-password"
              className={!novaSenha ? "" : senhaForte ? "is-ok" : "is-error"}
            />
          </label>

          <div className="reg-pwd-strength recovery-pwd-strength">
            <div className="reg-pwd-bar-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="reg-pwd-bar-seg"
                  style={{ background: i <= score ? "#7c3aed" : "#e2e8f0" }}
                />
              ))}
              <span
                className="reg-pwd-strength-label"
                style={{ color: score > 0 ? "#7c3aed" : "#64748b" }}
              >
                {score > 0
                  ? senhaForte
                    ? "Senha forte"
                    : "Senha fraca"
                  : "Regras da senha"}
              </span>
            </div>
            <ul className="reg-pwd-rules">
              {PASSWORD_RULES.map((rule) => {
                const ok = passed.includes(rule.key);
                return (
                  <li
                    key={rule.key}
                    className={`reg-pwd-rule ${ok ? "is-ok" : "is-fail"}`}
                  >
                    <span className="reg-pwd-rule-icon">{ok ? "✓" : "○"}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <label className="recovery-field-group" htmlFor="confirmarSenha">
            <span className="recovery-field-group__label">CONFIRMAR SENHA</span>
            <input
              id="confirmarSenha"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              autoComplete="new-password"
              className={!confirmar ? "" : senhasIguais ? "is-ok" : "is-error"}
            />
          </label>

          {confirmar.length > 0 && (
            <p
              className={`recovery-password-hint ${senhasIguais ? "is-ok" : "is-error"}`}
            >
              {senhasIguais
                ? "As senhas coincidem."
                : "As senhas não coincidem."}
            </p>
          )}

          <button
            className="recovery-submit-button"
            type="submit"
            disabled={isLoading || !token || !senhaForte || !senhasIguais}
          >
            {isLoading ? "SALVANDO..." : "REDEFINIR SENHA"}
          </button>

          <p className="recovery-login-link">
            <Link to="/login">Voltar para o login</Link>
          </p>

          {feedback.text && (
            <p
              className={`recovery-feedback-message${feedback.type === "success" ? " recovery-feedback-message--success" : ""}`}
            >
              {feedback.text}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
