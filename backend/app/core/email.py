import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="font-family:sans-serif;background:#f5f7fb;margin:0;padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="480" style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e9f2;">
        <tr><td style="padding-bottom:24px;border-bottom:1px solid #e5e9f2;">
          <h1 style="margin:0;font-size:20px;color:#1e2a3b;">Smart Frota</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#7b8ca0;">Gestão de Frota</p>
        </td></tr>
        <tr><td style="padding:24px 0;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e2a3b;">Recuperação de Senha</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            Você solicitou a redefinição da senha da sua conta Smart Frota.
            Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>{expire_minutes} minutos</strong>.
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="{reset_url}"
               style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
              Redefinir Senha
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px;">
            Se você não solicitou a recuperação de senha, ignore este e-mail.<br/>
            O link expira em {expire_minutes} minutos.
          </p>
        </td></tr>
        <tr><td style="padding-top:16px;border-top:1px solid #e5e9f2;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Smart Frota · Gestão de Frotas</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def send_password_reset_email(to_email: str, reset_url: str, settings) -> bool:
    """Send password reset e-mail. Returns True if sent, False when SMTP is not configured (dev mode)."""
    if not settings.smtp_host:
        logger.info("[DEV] Password reset URL for %s: %s", to_email, reset_url)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Smart Frota — Recuperação de Senha"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    html_body = _HTML_TEMPLATE.format(
        reset_url=reset_url,
        expire_minutes=settings.password_reset_expire_minutes,
    )
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.ehlo()
            if server.has_extn("STARTTLS"):
                server.starttls()
                server.ehlo()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        logger.info("Password reset email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send password reset email to %s: %s", to_email, exc)
        return False
