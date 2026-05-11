import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { recoverPasswordRequest } from "../services/auth";
import truckImage from "../assets/caminhao.avif";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function RecoverPasswordPage() {
  const navigate = useNavigate();
  const { showLoading, hideLoading, showSuccess, showError } = useUiFeedback();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback("");

    const trimmed = email.trim();
    if (!trimmed)
      return (
        setFeedback("Preencha o campo de e-mail."),
        showError("Preencha o campo de e-mail")
      );
    if (!isValidEmail(trimmed))
      return (
        setFeedback("Informe um e-mail válido."),
        showError("E-mail inválido")
      );

    setIsLoading(true);
    showLoading("Enviando...");

    try {
      await recoverPasswordRequest({ email: trimmed });
      navigate(
        `/email-enviado?tipo=recuperacao&email=${encodeURIComponent(trimmed)}`,
      );
      showSuccess("Solicitação enviada com sucesso");
    } catch {
      setFeedback(
        "Não foi possível enviar o link de recuperação. Tente novamente.",
      );
      showError("Erro ao enviar solicitação");
    } finally {
      setIsLoading(false);
      hideLoading();
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
          <p className="recovery-card__heading">Recuperar Senha</p>
          <p className="recovery-card__description">
            Informe seu e-mail para receber o link de recuperação
          </p>
          <label className="recovery-field-group" htmlFor="recoveryEmail">
            <span className="recovery-field-group__label">EMAIL</span>
            <input
              id="recoveryEmail"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button
            className="recovery-submit-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "ENVIANDO..." : "ENVIAR LINK"}
          </button>
          <p className="recovery-login-link">
            <Link to="/login">Voltar para o login</Link>
          </p>
          {feedback && <p className="recovery-feedback-message">{feedback}</p>}
        </form>
      </section>
    </main>
  );
}
