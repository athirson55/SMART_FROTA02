import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { resendVerificationRequest } from "../services/auth";
import truckImage from "../assets/caminhao.avif";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function EmailSentPage() {
  const [searchParams] = useSearchParams();
  const { showLoading, hideLoading, showSuccess, showError } = useUiFeedback();
  const tipo = searchParams.get("tipo") ?? "confirmacao";
  const emailFromQuery = searchParams.get("email") ?? "";
  const isVerificationFlow = tipo !== "recuperacao";

  const [email, setEmail] = useState(emailFromQuery);
  const [isResending, setIsResending] = useState(false);
  const title = useMemo(
    () =>
      isVerificationFlow
        ? "E-mail de confirmação enviado"
        : "E-mail de recuperação enviado",
    [isVerificationFlow],
  );
  const description = useMemo(
    () =>
      isVerificationFlow
        ? "Abra sua caixa de entrada e clique no link para ativar a conta. Se necessário, reenviamos a confirmação abaixo."
        : "Enviamos um link temporário para redefinir sua senha. Verifique a caixa de entrada e a pasta de spam.",
    [isVerificationFlow],
  );

  async function handleResend(event) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      showError("Informe o e-mail cadastrado");
      return;
    }
    if (!isValidEmail(trimmed)) {
      showError("E-mail inválido");
      return;
    }

    setIsResending(true);
    showLoading("Reenviando confirmação...");

    try {
      await resendVerificationRequest({ email: trimmed });
      showSuccess("Novo e-mail de confirmação enviado");
    } catch (err) {
      const feedback =
        err?.response?.data?.message ??
        "Não foi possível reenviar o e-mail de confirmação.";
      showError(feedback);
    } finally {
      setIsResending(false);
      hideLoading();
    }
  }

  return (
    <main className="recovery-screen auth-status-screen">
      <section className="recovery-screen__visual" aria-hidden="true">
        <img src={truckImage} alt="" />
      </section>
      <section className="recovery-screen__form-section">
        <div className="recovery-card auth-status-card">
          <div className="recovery-card__brand">
            <h1>SMART FROTA</h1>
            <p>SOLUÇÕES EM FROTA</p>
          </div>

          <p className="recovery-card__heading">{title}</p>
          <p className="recovery-card__description">{description}</p>

          <div
            className={`auth-status-pill ${isVerificationFlow ? "warning" : "success"}`}
          >
            {isVerificationFlow ? "Verifique seu email" : "Ação concluída"}
          </div>

          {isVerificationFlow ? (
            <form
              onSubmit={handleResend}
              className="auth-status-form"
              noValidate
            >
              <label className="recovery-field-group" htmlFor="sentEmail">
                <span className="recovery-field-group__label">E-MAIL</span>
                <input
                  id="sentEmail"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>

              <button
                className="recovery-submit-button"
                type="submit"
                disabled={isResending}
              >
                {isResending ? "REENVIANDO..." : "REENVIAR CONFIRMAÇÃO"}
              </button>
            </form>
          ) : (
            <Link
              className="recovery-submit-button auth-status-link-button"
              to="/login"
            >
              IR PARA O LOGIN
            </Link>
          )}

          <p className="recovery-login-link">
            <Link to="/login">Voltar para o login</Link>
          </p>

          <p className="recovery-login-link">
            <Link to={isVerificationFlow ? "/cadastro" : "/recuperar-senha"}>
              {isVerificationFlow
                ? "Cadastrar novo usuário"
                : "Solicitar novo link"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
