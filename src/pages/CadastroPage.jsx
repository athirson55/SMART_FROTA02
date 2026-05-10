import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import truckImage from "../assets/caminhao.avif";

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const PASSWORD_RULES = [
  { key: "length", label: "Mínimo 8 caracteres", test: (s) => s.length >= 8 },
  { key: "upper", label: "Letra maiúscula (A-Z)", test: (s) => /[A-Z]/.test(s) },
  { key: "lower", label: "Letra minúscula (a-z)", test: (s) => /[a-z]/.test(s) },
  { key: "number", label: "Número (0-9)", test: (s) => /[0-9]/.test(s) },
  {
    key: "special",
    label: "Caractere especial (!@#$...)",
    test: (s) => /[^A-Za-z0-9]/.test(s),
  },
];

const STRENGTH_LABELS = ["", "Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

function getPasswordStrength(password) {
  if (!password) return { score: 0, passed: [] };
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).map((r) => r.key);
  return { score: passed.length, passed };
}

export function CadastroPage() {
  const navigate = useNavigate();
  const { registrar } = useAuth();
  const { showLoading, hideLoading, showSuccess, showError } = useUiFeedback();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [touched, setTouched] = useState(false);

  const { score, passed } = useMemo(() => getPasswordStrength(senha), [senha]);
  const strengthLabel = STRENGTH_LABELS[score] ?? "";
  const strengthColor = STRENGTH_COLORS[score] ?? "";

  async function handleRegister(e) {
    e.preventDefault();
    setFeedback("");
    setTouched(true);
    const t = {
      nome: nome.trim(),
      email: email.trim(),
      senha: senha.trim(),
      confirmar: confirmar.trim(),
    };
    if (!t.nome || !t.email || !t.senha || !t.confirmar)
      return (
        setFeedback("Preencha todos os campos."),
        showError("Preencha todos os campos")
      );
    if (!isEmail(t.email))
      return (setFeedback("E-mail inválido."), showError("E-mail inválido"));
    if (t.senha.length < 8)
      return (
        setFeedback("Senha deve ter ao menos 8 caracteres."),
        showError("Senha muito curta")
      );
    if (score < 3)
      return (
        setFeedback("Senha muito fraca. Adicione mais requisitos."),
        showError("Senha fraca")
      );
    if (t.senha !== t.confirmar)
      return (
        setFeedback("Senhas não coincidem."),
        showError("Senhas não coincidem")
      );

    setIsLoading(true);
    showLoading("Criando conta...");
    try {
      await registrar({ nome: t.nome, email: t.email, senha: t.senha });
      showSuccess("Cadastro realizado com sucesso");
      await new Promise((resolve) =>
        window.requestAnimationFrame(() => resolve()),
      );
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
            <span className="register-field-group__label">NOME</span>
            <input
              id="nome"
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </label>
          <label className="register-field-group" htmlFor="email">
            <span className="register-field-group__label">EMAIL</span>
            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <div className="register-field-group">
            <label className="register-field-group__label" htmlFor="senha">
              SENHA
            </label>
            <input
              id="senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setTouched(true);
              }}
              required
            />

            {(touched && senha.length > 0) || senha.length > 0 ? (
              <div className="reg-pwd-strength">
                <div className="reg-pwd-bar-row">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="reg-pwd-bar-seg"
                      style={{
                        background: i <= score ? strengthColor : "#e2e8f0",
                        transition: "background 0.2s ease",
                      }}
                    />
                  ))}
                  {score > 0 && (
                    <span
                      className="reg-pwd-strength-label"
                      style={{ color: strengthColor }}
                    >
                      {strengthLabel}
                    </span>
                  )}
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
            ) : null}
          </div>
          <label className="register-field-group" htmlFor="confirmar">
            <span className="register-field-group__label">CONFIRMAR SENHA</span>
            <input
              id="confirmar"
              type="password"
              placeholder="Repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </label>
          <button
            className="register-submit-button"
            type="submit"
            disabled={isLoading}
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
