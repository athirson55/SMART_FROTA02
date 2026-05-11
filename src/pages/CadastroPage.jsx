import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import truckImage from "../assets/caminhao.avif";

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

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

const STRENGTH_LABELS = [
  "",
  "Muito fraca",
  "Fraca",
  "Razoável",
  "Forte",
  "Muito forte",
];
const STRENGTH_COLORS = [
  "",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#16a34a",
];

function getPasswordStrength(password) {
  if (!password) return { score: 0, passed: [] };
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).map(
    (r) => r.key,
  );
  return { score: passed.length, passed };
}

export function CadastroPage() {
  const navigate = useNavigate();
  const { registrar } = useAuth();
  const { showLoading, hideLoading, showError } = useUiFeedback();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const { score, passed } = useMemo(() => getPasswordStrength(senha), [senha]);
  const strengthLabel = STRENGTH_LABELS[score] ?? "";
  const strengthColor = STRENGTH_COLORS[score] ?? "";
  const senhasIguais = confirmar.length > 0 && senha === confirmar;
  const senhasDiferentes = confirmar.length > 0 && senha !== confirmar;
  const senhaForte = score === PASSWORD_RULES.length;
  const podeCadastrar =
    nome.trim().length >= 2 &&
    isEmail(email) &&
    senhaForte &&
    senha === confirmar;

  async function handleRegister(e) {
    e.preventDefault();
    setFeedback("");

    const t = { nome: nome.trim(), email: email.trim(), senha, confirmar };

    if (!t.nome || !t.email || !t.senha || !t.confirmar) {
      setFeedback("Preencha todos os campos.");
      return showError("Preencha todos os campos");
    }
    if (!isEmail(t.email)) {
      setFeedback("E-mail inválido.");
      return showError("E-mail inválido");
    }
    if (score < 5) {
      setFeedback("A senha não atende a todos os requisitos de segurança.");
      return showError("A senha não atende a todos os requisitos");
    }
    if (t.senha !== t.confirmar) {
      setFeedback("As senhas não coincidem.");
      return showError("As senhas não coincidem");
    }

    setIsLoading(true);
    showLoading("Criando conta...");
    try {
      const result = await registrar({
        nome: t.nome,
        email: t.email,
        senha: t.senha,
      });
      if (result?.requiresEmailVerification) {
        navigate(
          `/email-enviado?tipo=confirmacao&email=${encodeURIComponent(result.email)}`,
        );
        return;
      }
      navigate("/home");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Não foi possível criar a conta.";
      setFeedback(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  }

  return (
    <main className="register-screen">
      <section className="register-screen__visual" aria-hidden="true">
        <img src={truckImage} alt="" />
      </section>
      <section className="register-screen__form-section">
        <form className="register-card" onSubmit={handleRegister} noValidate>
          <div className="register-card__brand">
            <h1>SMART FROTA</h1>
            <p>SOLUÇÕES EM FROTA</p>
          </div>

          <p className="register-card__heading">Criar Conta</p>

          <label className="register-field-group" htmlFor="nome">
            <span className="register-field-group__label">NOME COMPLETO</span>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              required
            />
          </label>

          <label className="register-field-group" htmlFor="email">
            <span className="register-field-group__label">E-MAIL</span>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <div className="register-field-group">
            <label className="register-field-group__label" htmlFor="senha">
              SENHA
            </label>
            <div className="register-input-wrap">
              <input
                id="senha"
                type={showSenha ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                required
                className={!senha ? "" : senhaForte ? "is-ok" : "is-error"}
              />
              <button
                type="button"
                className="register-eye-btn"
                onClick={() => setShowSenha((v) => !v)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? "🙈" : "👁"}
              </button>
            </div>

            <div className="reg-pwd-strength">
              <div className="reg-pwd-bar-row">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="reg-pwd-bar-seg"
                    style={{
                      background:
                        i <= score ? strengthColor || "#94a3b8" : "#e2e8f0",
                    }}
                  />
                ))}
                <span
                  className="reg-pwd-strength-label"
                  style={{ color: score > 0 ? strengthColor : "#64748b" }}
                >
                  {score > 0 ? strengthLabel : "Força da senha"}
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
                      <span className="reg-pwd-rule-icon">
                        {ok ? "✓" : "○"}
                      </span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="register-field-group">
            <label className="register-field-group__label" htmlFor="confirmar">
              CONFIRMAR SENHA
            </label>
            <div className="register-input-wrap">
              <input
                id="confirmar"
                type={showConfirmar ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                className={
                  senhasDiferentes ? "is-error" : senhasIguais ? "is-ok" : ""
                }
                required
              />
              <button
                type="button"
                className="register-eye-btn"
                onClick={() => setShowConfirmar((v) => !v)}
                aria-label={showConfirmar ? "Ocultar" : "Mostrar"}
              >
                {showConfirmar ? "🙈" : "👁"}
              </button>
            </div>
            {senhasDiferentes && (
              <span className="register-field-hint is-error">
                As senhas não coincidem
              </span>
            )}
            {senhasIguais && (
              <span className="register-field-hint is-ok">
                Senhas coincidem ✓
              </span>
            )}
          </div>

          <button
            className="register-submit-button"
            type="submit"
            disabled={isLoading || !podeCadastrar}
          >
            {isLoading ? "CADASTRANDO..." : "CADASTRAR"}
          </button>

          <p className="register-login-link">
            <Link to="/login">Já tem uma conta? Entrar</Link>
          </p>

          {feedback && <p className="register-feedback-message">{feedback}</p>}
        </form>
      </section>
    </main>
  );
}
