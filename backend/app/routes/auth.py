from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.config import get_settings
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.auth import (
    AuthEmailVerificationRequest,
    AuthLoginRequest,
    AuthPasswordChangeRequest,
    AuthPasswordRecoveryRequest,
    AuthPasswordResetRequest,
    AuthProfileUpdateRequest,
    AuthRefreshRequest,
    AuthRegisterRequest,
    AuthResendVerificationRequest,
)
from app.services.auth_service import (
    authenticate_user,
    change_password,
    consume_password_reset_token,
    create_password_reset_token,
    issue_token_pair,
    refresh_session,
    register_user,
    resend_verification_email,
    revoke_refresh_token,
    serialize_user,
    update_me,
    verify_email_token,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])
settings = get_settings()


@router.post("/registrar")
def registrar(payload: AuthRegisterRequest, db: Session = Depends(get_db)):
    user, verification_token = register_user(db, nome=payload.nome, email=payload.email, senha=payload.senha)
    payload_data = {"requiresEmailVerification": True, "email": user.email}
    if not settings.is_production_like and verification_token:
        payload_data["debugVerificationToken"] = verification_token
    return success_response(
        "Cadastro realizado! Verifique seu e-mail para ativar a conta.",
        payload_data,
    )


@router.post("/login")
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, payload.email, payload.senha)
    except HTTPException as exc:
        if exc.detail == "EMAIL_NOT_VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="E-mail não confirmado. Verifique sua caixa de entrada.",
                headers={"X-Error-Code": "EMAIL_NOT_VERIFIED"},
            )
        raise
    tokens = issue_token_pair(db, user, keep_logged_in=payload.manterConectado)
    return success_response("Login realizado com sucesso", {
        "token": tokens["token"],
        "refreshToken": tokens["refreshToken"],
        "usuario": tokens["usuario"],
        "expiresIn": tokens["expiresIn"],
        "refreshExpiresIn": tokens["refreshExpiresIn"],
    })


@router.post("/verificar-email")
def verificar_email(payload: AuthEmailVerificationRequest, db: Session = Depends(get_db)):
    user = verify_email_token(db, payload.token)
    tokens = issue_token_pair(db, user)
    return success_response("E-mail confirmado com sucesso! Bem-vindo ao Smart Frota.", {
        "token": tokens["token"],
        "refreshToken": tokens["refreshToken"],
        "usuario": tokens["usuario"],
        "expiresIn": tokens["expiresIn"],
        "refreshExpiresIn": tokens["refreshExpiresIn"],
    })


@router.post("/reenviar-verificacao")
def reenviar_verificacao(payload: AuthResendVerificationRequest, db: Session = Depends(get_db)):
    verification_token = resend_verification_email(db, payload.email.strip().lower())
    payload_data = {"sent": True}
    if not settings.is_production_like and verification_token:
        payload_data["debugVerificationToken"] = verification_token
    return success_response(
        "Se o e-mail existir e ainda não estiver confirmado, reenviaremos as instruções.",
        payload_data,
    )


@router.post("/refresh")
def refresh(payload: AuthRefreshRequest, db: Session = Depends(get_db)):
    tokens = refresh_session(db, payload.refreshToken)
    return success_response("Sessão renovada com sucesso", tokens)


@router.post("/logout")
def logout(payload: AuthRefreshRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, payload.refreshToken)
    return success_response("Logout realizado com sucesso", {"loggedOut": True})


@router.get("/eu")
def me(current_user=Depends(get_current_user)):
    return success_response("Usuário autenticado", serialize_user(current_user))


@router.patch("/eu")
def update_me_route(
    payload: AuthProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = update_me(db, current_user, payload.model_dump(exclude_unset=True))
    return success_response("Perfil atualizado com sucesso", serialize_user(user))


@router.post("/trocar-senha")
def change_password_route(
    payload: AuthPasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    change_password(db, current_user, payload.senhaAtual, payload.novaSenha)
    return success_response("Senha alterada com sucesso", {"changed": True})


@router.post("/recuperar-senha")
def recover_password(payload: AuthPasswordRecoveryRequest, db: Session = Depends(get_db)):
    reset_token = create_password_reset_token(db, payload.email.strip().lower())
    payload_data = {"sent": True}
    if settings.environment != "production" and reset_token:
        payload_data["debugResetToken"] = reset_token
    return success_response(
        "Se o e-mail existir, enviaremos instruções de recuperação.",
        payload_data,
    )


@router.post("/redefinir-senha")
def reset_password(payload: AuthPasswordResetRequest, db: Session = Depends(get_db)):
    consume_password_reset_token(db, payload.token, payload.novaSenha)
    return success_response("Senha redefinida com sucesso", {"reset": True})
