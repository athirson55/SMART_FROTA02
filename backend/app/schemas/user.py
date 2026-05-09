from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(default="ADMIN", max_length=40)
    avatarFoto: str | None = None


class UserCreate(UserBase):
    senha: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    role: str | None = Field(default=None, max_length=40)
    avatarFoto: str | None = None
    senha: str | None = Field(default=None, min_length=8, max_length=128)
    isActive: bool | None = None


class UserRead(UserBase):
    id: str
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
