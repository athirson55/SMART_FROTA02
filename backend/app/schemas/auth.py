import re

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password_strength(v: str) -> str:
    errors = []
    if len(v) < 8:
        errors.append("mínimo 8 caracteres")
    if not re.search(r"[A-Z]", v):
        errors.append("uma letra maiúscula")
    if not re.search(r"[a-z]", v):
        errors.append("uma letra minúscula")
    if not re.search(r"[0-9]", v):
        errors.append("um número")
    if not re.search(r"[^A-Za-z0-9]", v):
        errors.append("um caractere especial (!@#$%...)")
    if errors:
        raise ValueError(f"A senha deve conter: {', '.join(errors)}")
    return v


class AuthRegisterRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)

    @field_validator("senha")
    @classmethod
    def senha_forte(cls, v: str) -> str:
        return _validate_password_strength(v)


class AuthLoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=1, max_length=128)
    manterConectado: bool = False


class AuthRefreshRequest(BaseModel):
    refreshToken: str


class AuthPasswordRecoveryRequest(BaseModel):
    email: EmailStr


class AuthPasswordResetRequest(BaseModel):
    token: str
    novaSenha: str = Field(min_length=8, max_length=128)

    @field_validator("novaSenha")
    @classmethod
    def nova_senha_forte(cls, v: str) -> str:
        return _validate_password_strength(v)


class AuthEmailVerificationRequest(BaseModel):
    token: str


class AuthResendVerificationRequest(BaseModel):
    email: EmailStr


class TokenPair(BaseModel):
    token: str
    refreshToken: str
    expiresIn: int
    refreshExpiresIn: int


class AuthUserResponse(BaseModel):
    id: str
    nome: str
    email: EmailStr
    role: str
    avatarFoto: str | None = None


class AuthProfileUpdateRequest(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=120)
    avatarFoto: str | None = None


class AuthPasswordChangeRequest(BaseModel):
    senhaAtual: str = Field(min_length=1, max_length=128)
    novaSenha: str = Field(min_length=8, max_length=128)

    @field_validator("novaSenha")
    @classmethod
    def nova_senha_forte(cls, v: str) -> str:
        return _validate_password_strength(v)
