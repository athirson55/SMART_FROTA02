import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import truckImage from "../assets/caminhao.avif";

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

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

  async function handleRegister(e) {
    e.preventDefault();
    setFeedback("");
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
    if (t.senha !== t.confirmar)
      return (
        setFeedback("Senhas não coincidem."),
        showError("Senhas não coincidem")
      );
    if (t.senha.length < 6)
      return (
        setFeedback("Senha deve ter ao menos 6 caracteres."),
        showError("Senha curta")
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
          <label className="register-field-group" htmlFor="senha">
            <span className="register-field-group__label">SENHA</span>
            <input
              id="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>
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
