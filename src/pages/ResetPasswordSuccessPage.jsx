import { Link } from "react-router-dom";
import truckImage from "../assets/caminhao.avif";

export function ResetPasswordSuccessPage() {
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

          <p className="recovery-card__heading">Senha redefinida com sucesso</p>
          <p className="recovery-card__description">
            Sua senha foi atualizada. Use a nova senha para acessar sua conta
            com segurança.
          </p>

          <div className="auth-status-pill success">Senha alterada</div>

          <Link
            className="recovery-submit-button auth-status-link-button"
            to="/login"
          >
            IR PARA O LOGIN
          </Link>

          <p className="recovery-login-link">
            <Link to="/recuperar-senha">
              Solicitar novo link de recuperação
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
