import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import {
  resendVerificationRequest,
  verifyEmailRequest,
} from "../services/auth";
import truckImage from "../assets/caminhao.avif";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptVerification } = useAuth();
  const { showLoading, hideLoading, showSuccess, showError } = useUiFeedback();
  const autoVerifyTimerRef = useRef(null);

  const token = searchParams.get("token") ?? "";
  const emailFromQuery = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromQuery);
  const [status, setStatus] = useState(token ? "loading" : "idle");
  const [message, setMessage] = useState(
    token
      ? "Validando o link de confirmação..."
      : "Se o link expirou, informe seu e-mail para reenviar a confirmação.",
  );
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("idle");
      return undefined;
    }

    let active = true;
    setStatus("loading");
    setMessage("Validando o link de confirmação...");
    showLoading("Confirmando e-mail...");

    verifyEmailRequest({ token })
      .then((response) => {
        if (!active) return;
        const data = response.data?.data ?? response.data;
        acceptVerification(data.token, data.refreshToken, data.usuario);
        setStatus("success");
        setMessage(
          "E-mail confirmado com sucesso. Redirecionando para a área interna...",
        );
        showSuccess("E-mail confirmado com sucesso");
        autoVerifyTimerRef.current = window.setTimeout(() => {
          navigate("/home", { replace: true });
        }, 1200);
      })
      .catch((err) => {
        if (!active) return;
        const feedback =
          err?.response?.data?.message ??
          "O link é inválido ou expirou. Solicite um novo e-mail de confirmação.";
        setStatus("error");
        setMessage(feedback);
        showError(feedback);
      })
      .finally(() => {
        if (active) hideLoading();
      });

    return () => {
      active = false;
      if (autoVerifyTimerRef.current) {
        window.clearTimeout(autoVerifyTimerRef.current);
      }
    };
  }, [
    acceptVerification,
    hideLoading,
    navigate,
    showError,
    showLoading,
    showSuccess,
    token,
  ]);

  async function handleResend(event) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setMessage("Informe o e-mail cadastrado para reenviar a confirmação.");
      showError("Informe o e-mail cadastrado");
      return;
    }

    if (!isValidEmail(trimmed)) {
      setMessage("Informe um e-mail válido.");
      showError("E-mail inválido");
      return;
    }

    setIsResending(true);
    showLoading("Reenviando e-mail...");

    try {
      await resendVerificationRequest({ email: trimmed });
      setStatus("idle");
      setMessage(
        "Se o e-mail existir e ainda não tiver sido confirmado, o novo link foi enviado.",
      );
      showSuccess("E-mail de confirmação reenviado");
      navigate(
        `/email-enviado?tipo=confirmacao&email=${encodeURIComponent(trimmed)}`,
        { replace: true },
      );
    } catch (err) {
      const feedback =
        err?.response?.data?.message ??
        "Não foi possível reenviar o e-mail de confirmação.";
      setMessage(feedback);
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
        <form
          className="recovery-card auth-status-card"
          onSubmit={handleResend}
          noValidate
        >
          <div className="recovery-card__brand">
            <h1>SMART FROTA</h1>
            <p>SOLUÇÕES EM FROTA</p>
          </div>

          <p className="recovery-card__heading">Confirmação de E-mail</p>
          <p className="recovery-card__description">{message}</p>

          <div className={`auth-status-pill ${status}`}>
            {status === "success"
              ? "Conta ativada"
              : status === "loading"
                ? "Validando link"
                : "Aguardando confirmação"}
          </div>

          <label className="recovery-field-group" htmlFor="verificationEmail">
            <span className="recovery-field-group__label">E-MAIL</span>
            <input
              id="verificationEmail"
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
            disabled={isResending || status === "loading"}
          >
            {isResending ? "REENVIANDO..." : "REENVIAR CONFIRMAÇÃO"}
          </button>

          <p className="recovery-login-link">
            <Link to="/login">Ir para o login</Link>
          </p>

          <p className="recovery-login-link">
            <Link to="/cadastro">Criar nova conta</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
