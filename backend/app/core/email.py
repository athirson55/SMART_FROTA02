import json
import logging
import smtplib
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_BASE = """<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(47,103,216,.10);">
      <tr>
        <td style="background:linear-gradient(135deg,#2f67d8 0%,#4f46e5 100%);padding:28px 36px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 14px;">
              <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:1px;">SMART FROTA</span>
            </td>
            <td style="padding-left:14px;">
              <span style="color:rgba(255,255,255,.75);font-size:12px;">Gestao de Frotas</span>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr><td style="padding:36px 36px 28px;">{BODY}</td></tr>
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e5e9f2;padding:20px 36px;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
            Este e-mail foi enviado automaticamente. Nao responda.<br/>
            Se voce nao solicitou esta acao, ignore este e-mail.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def _btn(url: str, label: str, color: str = "#2f67d8") -> str:
    return (
        f'<p style="text-align:center;margin:28px 0 8px;">'
        f'<a href="{url}" style="display:inline-block;background:{color};color:#ffffff;'
        f"text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;"
        f'font-size:15px;box-shadow:0 4px 14px rgba(47,103,216,.35);">{label}</a></p>'
        f'<p style="text-align:center;font-size:11px;color:#94a3b8;margin:0 0 8px;">'
        f'Ou copie: <a href="{url}" style="color:#2f67d8;word-break:break-all;">{url}</a></p>'
    )


def _build_verification_html(name: str, verify_url: str, expire_hours: int) -> str:
    plural = "s" if expire_hours != 1 else ""
    body = (
        '<h2 style="margin:0 0 8px;font-size:22px;color:#1e2a3b;">Confirme seu e-mail</h2>'
        f'<p style="margin:0 0 20px;font-size:14px;color:#64748b;">Ola, <strong style="color:#1e2a3b;">{name}</strong>!</p>'
        '<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 6px;">'
        "Voce criou uma conta no <strong>Smart Frota</strong>. "
        "Para ativar seu acesso, confirme seu e-mail clicando no botao abaixo.</p>"
        f'<p style="font-size:13px;color:#94a3b8;margin:0 0 24px;">Este link expira em <strong>{expire_hours} hora{plural}</strong>.</p>'
        + _btn(verify_url, "Confirmar E-mail", "#2f67d8")
        + '<div style="background:#f0f4ff;border-radius:10px;padding:14px 18px;margin-top:24px;">'
        '<p style="margin:0;font-size:12px;color:#475569;">'
        "Se voce nao criou esta conta, ignore este e-mail. Nenhuma acao e necessaria.</p></div>"
    )
    return _BASE.replace("{BODY}", body)


def _build_verification_text(name: str, verify_url: str, expire_hours: int) -> str:
    return (
        f"Olá, {name}!\n\n"
        "Você criou uma conta no Smart Frota.\n"
        "Para ativar seu acesso, confirme seu e-mail usando o link abaixo:\n\n"
        f"{verify_url}\n\n"
        f"Este link expira em {expire_hours} hora(s).\n\n"
        "Se você não criou esta conta, ignore esta mensagem."
    )


def _build_reset_html(reset_url: str, expire_minutes: int) -> str:
    body = (
        '<h2 style="margin:0 0 8px;font-size:22px;color:#1e2a3b;">Redefinicao de Senha</h2>'
        '<p style="margin:0 0 20px;font-size:14px;color:#64748b;">Recebemos uma solicitacao de redefinicao de senha.</p>'
        '<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 6px;">'
        "Clique no botao abaixo para criar uma nova senha.</p>"
        f'<p style="font-size:13px;color:#94a3b8;margin:0 0 24px;">Este link expira em <strong>{expire_minutes} minutos</strong>.</p>'
        + _btn(reset_url, "Redefinir Senha", "#7c3aed")
        + '<div style="background:#fef9f0;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-top:24px;">'
        '<p style="margin:0;font-size:12px;color:#92400e;">'
        "Se voce nao solicitou a redefinicao, sua senha permanece inalterada.</p></div>"
    )
    return _BASE.replace("{BODY}", body)


def _build_reset_text(reset_url: str, expire_minutes: int) -> str:
    return (
        "Redefinição de senha\n\n"
        "Recebemos uma solicitação de redefinição de senha para sua conta no Smart Frota.\n\n"
        f"Abra este link para criar uma nova senha:\n{reset_url}\n\n"
        f"Este link expira em {expire_minutes} minutos.\n\n"
        "Se você não solicitou a redefinição, sua senha permanece inalterada."
    )


def _build_reset_success_html(name: str) -> str:
    body = (
        '<h2 style="margin:0 0 8px;font-size:22px;color:#1e2a3b;">Senha alterada com sucesso</h2>'
        f'<p style="margin:0 0 20px;font-size:14px;color:#64748b;">Ola, <strong style="color:#1e2a3b;">{name}</strong>!</p>'
        '<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 24px;">'
        "Sua senha foi redefinida. Voce ja pode acessar o Smart Frota com sua nova senha.</p>"
        '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">'
        '<p style="margin:0;font-size:12px;color:#166534;">'
        "Se voce nao realizou esta alteracao, entre em contato com o suporte imediatamente.</p></div>"
    )
    return _BASE.replace("{BODY}", body)


def _build_reset_success_text(name: str) -> str:
    return (
        f"Olá, {name}!\n\n"
        "Sua senha foi redefinida com sucesso. Você já pode acessar o Smart Frota com a nova senha.\n\n"
        "Se você não realizou esta alteração, entre em contato com o suporte imediatamente."
    )


def _from_header(settings) -> str:
    name = getattr(settings, "email_from_name", "Smart Frota")
    # Resend funciona melhor com o remetente padrao verificado.
    if getattr(settings, "resend_api_key", ""):
        sender = "onboarding@resend.dev"
    else:
        sender = getattr(settings, "smtp_from", "")
    return f"{name} <{sender}>"


def _send_via_resend(api_key: str, to: str, subject: str, html: str, from_header: str) -> bool:
    payload = json.dumps({"from": from_header, "to": [to], "subject": subject, "html": html}).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            # Ler corpo para logging e inspecao
            try:
                body_bytes = resp.read()
                body_text = body_bytes.decode("utf-8", errors="replace") if body_bytes is not None else ""
            except Exception:
                body_text = "<unreadable>"
            logger.info("Resend response to %s: status=%s body=%s", to, getattr(resp, "status", "?"), body_text)
            return 200 <= int(getattr(resp, "status", 0)) < 300
    except Exception as exc:
        logger.exception("Resend error to %s: %s", to, exc)
        return False


def _send_via_smtp(settings, to: str, subject: str, html: str) -> bool:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = _from_header(settings)
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.ehlo()
            if server.has_extn("STARTTLS"):
                server.starttls()
                server.ehlo()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to], msg.as_string())
        return True
    except Exception as exc:
        logger.error("SMTP error to %s: %s", to, exc)
        return False


def _dispatch(settings, to: str, subject: str, html: str) -> bool:
    if getattr(settings, "resend_api_key", ""):
        return _send_via_resend(settings.resend_api_key, to, subject, html, _from_header(settings))
    if getattr(settings, "smtp_host", ""):
        return _send_via_smtp(settings, to, subject, html)
    if not getattr(settings, "is_production_like", False):
        logger.info("[DEV] Email delivery not configured for %s: %s", to, subject)
        return True
    logger.error("Email provider not configured in production-like environment for %s: %s", to, subject)
    return False


def _dispatch_with_text(settings, to: str, subject: str, html: str, text: str) -> bool:
    if getattr(settings, "resend_api_key", ""):
        payload = json.dumps(
            {
                "from": _from_header(settings),
                "to": [to],
                "subject": subject,
                "html": html,
                "text": text,
            }
        ).encode()
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={"Authorization": f"Bearer {settings.resend_api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                try:
                    body_bytes = resp.read()
                    body_text = body_bytes.decode("utf-8", errors="replace") if body_bytes is not None else ""
                except Exception:
                    body_text = "<unreadable>"
                logger.info("Resend response to %s: status=%s body=%s", to, getattr(resp, "status", "?"), body_text)
                return 200 <= int(getattr(resp, "status", 0)) < 300
        except Exception as exc:
            logger.exception("Resend error to %s: %s", to, exc)
            return False
    if getattr(settings, "smtp_host", ""):
        return _send_via_smtp(settings, to, subject, html)
    if not getattr(settings, "is_production_like", False):
        logger.info("[DEV] Email delivery not configured for %s: %s", to, subject)
        return True
    logger.error("Email provider not configured in production-like environment for %s: %s", to, subject)
    return False


def send_verification_email(to_email: str, name: str, verify_url: str, settings) -> bool:
    expire_hours = getattr(settings, "email_verify_expire_hours", 24)
    html = _build_verification_html(name, verify_url, expire_hours)
    text = _build_verification_text(name, verify_url, expire_hours)
    sent = _dispatch_with_text(settings, to_email, "Smart Frota - Confirme seu e-mail", html, text)
    if not sent:
        logger.info("[DEV] Verification URL for %s: %s", to_email, verify_url)
    return sent


def send_password_reset_email(to_email: str, reset_url: str, settings) -> bool:
    expire_minutes = getattr(settings, "password_reset_expire_minutes", 60)
    html = _build_reset_html(reset_url, expire_minutes)
    text = _build_reset_text(reset_url, expire_minutes)
    sent = _dispatch_with_text(settings, to_email, "Smart Frota - Recuperacao de Senha", html, text)
    if not sent:
        logger.info("[DEV] Reset URL for %s: %s", to_email, reset_url)
    return sent


def send_password_reset_success_email(to_email: str, name: str, settings) -> None:
    html = _build_reset_success_html(name)
    text = _build_reset_success_text(name)
    _dispatch_with_text(settings, to_email, "Smart Frota - Senha alterada com sucesso", html, text)


_PRIORIDADE_COLOR = {
    "CRITICO": "#DC2626",
    "MEDIO": "#D97706",
    "BAIXO": "#2563EB",
}

_PRIORIDADE_LABEL = {
    "CRITICO": "CRÍTICO",
    "MEDIO": "MODERADO",
    "BAIXO": "BAIXO",
}


def _build_alert_email_html(alerts_data: list[dict], frontend_url: str) -> str:
    """Build HTML for a batch of critical/important alerts."""
    rows = ""
    for a in alerts_data[:10]:
        color = _PRIORIDADE_COLOR.get(a.get("prioridade", "MEDIO").upper(), "#D97706")
        label = _PRIORIDADE_LABEL.get(a.get("prioridade", "MEDIO").upper(), "MODERADO")
        rows += (
            f'<tr>'
            f'<td style="padding:10px 0;border-bottom:1px solid #e5e9f2;">'
            f'<span style="display:inline-block;background:{color};color:#fff;font-size:10px;'
            f'font-weight:700;padding:2px 7px;border-radius:4px;margin-bottom:4px;">{label}</span><br/>'
            f'<strong style="font-size:13px;color:#1e2a3b;">{a.get("titulo","Alerta")}</strong><br/>'
            f'<span style="font-size:12px;color:#64748b;">{a.get("mensagem","")[:120]}</span>'
            f'</td>'
            f'</tr>'
        )

    total = len(alerts_data)
    alerts_url = f"{frontend_url}/#/alertas"
    body = (
        '<h2 style="margin:0 0 8px;font-size:22px;color:#1e2a3b;">Alertas da sua frota</h2>'
        '<p style="margin:0 0 20px;font-size:14px;color:#64748b;">'
        f'Foram identificados <strong style="color:#DC2626;">{total} alerta(s)</strong> '
        'que precisam da sua atenção no Smart Frota.</p>'
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">'
        + rows
        + "</table>"
        + _btn(alerts_url, "Ver todos os alertas", "#DC2626")
        + '<div style="background:#fff7f7;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-top:24px;">'
        '<p style="margin:0;font-size:12px;color:#991b1b;">'
        "Acesse a Central de Alertas para resolver os pendentes e evitar problemas na operação.</p></div>"
    )
    return _BASE.replace("{BODY}", body)


def send_alert_email(to_email: str, alerts_data: list[dict], settings) -> bool:
    """Send a batch alert notification email. alerts_data is list of dicts with titulo/mensagem/prioridade."""
    if not alerts_data:
        return False
    frontend_url = getattr(settings, "frontend_url", "https://athirson55.github.io/SMART_FROTA02")
    html = _build_alert_email_html(alerts_data, frontend_url)
    subject = f"Smart Frota — {len(alerts_data)} alerta(s) crítico(s) na sua frota"
    return _dispatch(settings, to_email, subject, html)
