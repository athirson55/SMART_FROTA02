from pydantic import BaseModel, EmailStr, Field


class AuthRegisterRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)


class AuthLoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    manterConectado: bool = False


class AuthRefreshRequest(BaseModel):
    refreshToken: str


class AuthPasswordRecoveryRequest(BaseModel):
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


class AuthPasswordChangeRequest(BaseModel):
    senhaAtual: str = Field(min_length=1, max_length=128)
    novaSenha: str = Field(min_length=8, max_length=128)
