import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import truckImage from "../assets/caminhao.avif";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showLoading, hideLoading, showSuccess, showError } = useUiFeedback();
  const [email, setEmail]                   = useState("");
  const [senha, setSenha]                   = useState("");
  const [manterConectado, setManter]        = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [feedback, setFeedback]             = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setFeedback("");
    if (!email.trim() || !senha.trim()) {
      setFeedback("Preencha todos os campos.");
      return showError("Preencha todos os campos");
    }
    setIsLoading(true);
    showLoading("Entrando...");
    try {
      await login({ email: email.trim(), senha: senha.trim(), manterConectado });
      showSuccess("Login realizado com sucesso");
      navigate("/home");
    } catch (err) {
      const msg = err?.response?.data?.message || "E-mail ou senha incorretos.";
      setFeedback(msg);
      showError(msg);
    } finally { setIsLoading(false); hideLoading(); }
  }

  return (
    <main className="login-screen">
      <section className="login-screen__visual" aria-hidden="true">
        <img src={truckImage} alt="" />
      </section>
      <section className="login-screen__form-section">
        <form className="login-card" onSubmit={handleLogin} noValidate>
          <div className="login-card__brand">
            <h1>SMART FROTA</h1>
            <p>SOLUÇÕES EM FROTA</p>
          </div>
          <p className="login-card__heading">
            <span>Acesse o </span><strong>PORTAL DE GESTÃO</strong>
          </p>
          <label className="login-field-group" htmlFor="email">
            <span className="login-field-group__label">EMAIL</span>
            <input id="email" type="email" placeholder="Digite seu e-mail"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="login-field-group" htmlFor="senha">
            <span className="login-field-group__label">SENHA</span>
            <input id="senha" type="password" placeholder="Digite sua senha"
              value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </label>
          <div className="login-meta-row">
            <label className="login-checkbox-row" htmlFor="manter">
              <input id="manter" type="checkbox" checked={manterConectado}
                onChange={(e) => setManter(e.target.checked)} />
              <span>Manter Conectado</span>
            </label>
            <Link to="/recuperar-senha">Recuperar senha</Link>
          </div>
          <button className="login-submit-button" type="submit" disabled={isLoading}>
            {isLoading ? "ENTRANDO..." : "ENTRAR"}
          </button>
          <p className="login-register-link">
            <Link to="/cadastro">Não possui conta? Cadastre-se</Link>
          </p>
          {feedback && <p className="login-feedback-message">{feedback}</p>}
        </form>
      </section>
    </main>
  );
}
