from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.auth import (
    AuthLoginRequest,
    AuthPasswordRecoveryRequest,
    AuthRefreshRequest,
    AuthRegisterRequest,
)
from app.services.auth_service import (
    authenticate_user,
    issue_token_pair,
    refresh_session,
    register_user,
    revoke_refresh_token,
    serialize_user,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar")
def registrar(payload: AuthRegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, nome=payload.nome, email=payload.email, senha=payload.senha)
    tokens = issue_token_pair(db, user, keep_logged_in=True)
    return success_response("Cadastro realizado com sucesso", {"token": tokens["token"], "refreshToken": tokens["refreshToken"], "usuario": tokens["usuario"], "expiresIn": tokens["expiresIn"], "refreshExpiresIn": tokens["refreshExpiresIn"]})


@router.post("/login")
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.senha)
    tokens = issue_token_pair(db, user, keep_logged_in=payload.manterConectado)
    return success_response("Login realizado com sucesso", {"token": tokens["token"], "refreshToken": tokens["refreshToken"], "usuario": tokens["usuario"], "expiresIn": tokens["expiresIn"], "refreshExpiresIn": tokens["refreshExpiresIn"]})


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


@router.post("/recuperar-senha")
def recover_password(payload: AuthPasswordRecoveryRequest, db: Session = Depends(get_db)):
    user = authenticate_user if False else None
    _ = db
    _ = payload
    return success_response("Se o e-mail existir, enviaremos instruções de recuperação", {"sent": True})
