from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "role": user.role,
        "avatarFoto": user.avatar_foto,
        "isActive": user.is_active,
        "createdAt": user.created_at,
        "updatedAt": user.updated_at,
    }


def list_users(db: Session, search: str | None = None, page: int = 1, limit: int = 25):
    query = select(User)
    if search:
        like = f"%{search.strip()}%"
        query = query.where((User.nome.ilike(like)) | (User.email.ilike(like)))
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total or 0


def get_user(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, data: dict) -> User:
    email = data["email"].lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")
    user = User(
        nome=data["nome"].strip(),
        email=email,
        senha_hash=hash_password(data["senha"]),
        role=data.get("role", "ADMIN"),
        avatar_foto=data.get("avatarFoto"),
        is_active=data.get("isActive", True),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: dict) -> User:
    if data.get("email"):
        email = data["email"].lower().strip()
        existing = db.scalar(select(User).where(User.email == email, User.id != user.id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")
        user.email = email
    if data.get("nome") is not None:
        user.nome = data["nome"].strip()
    if data.get("role") is not None:
        user.role = data["role"]
    if "avatarFoto" in data:
        user.avatar_foto = data.get("avatarFoto")
    if data.get("isActive") is not None:
        user.is_active = data["isActive"]
    if data.get("senha"):
        user.senha_hash = hash_password(data["senha"])
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
