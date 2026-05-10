import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../services/auth";
import truckImage from "../assets/caminhao.avif";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!token) {
      setFeedback({ type: "error", text: "Link inválido. Solicite um novo link de recuperação." });
      return;
    }
    if (novaSenha.length < 8) {
      setFeedback({ type: "error", text: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }
    if (novaSenha !== confirmar) {
      setFeedback({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordRequest({ token, novaSenha });
      setFeedback({ type: "success", text: "Senha redefinida com sucesso! Redirecionando para o login..." });
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Token inválido ou expirado. Solicite um novo link.";
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
            />
          </label>

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
            />
          </label>

          <button
            className="recovery-submit-button"
            type="submit"
            disabled={isLoading || !token}
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
