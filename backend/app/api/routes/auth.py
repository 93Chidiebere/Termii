from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List, Optional as Opt
from datetime import date
from pydantic import BaseModel as BM
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.services.auth import get_password_hash, verify_password, create_access_token
from app.core.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

MINIMUM_AGE = 16


# ── Helper: compute age from date of birth ─────────────────────────────────────
def calculate_age(dob: date) -> int:
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age


# ── Helper: decode JWT and return the current user ────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await User.find_one(User.email == email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── POST /auth/register ───────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate):
    existing_user = await User.find_one(User.email == user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check username uniqueness if provided
    if user_in.username:
        existing_username = await User.find_one(User.username == user_in.username)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pwd = get_password_hash(user_in.password)
    age = calculate_age(user_in.date_of_birth)

    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        username=user_in.username,
        hair_type=user_in.hair_type,
        date_of_birth=user_in.date_of_birth,
        age_verified=age >= MINIMUM_AGE,
    )
    await user.insert()
    return UserResponse.from_mongo(user)


# ── POST /auth/login ──────────────────────────────────────────────────────────
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if getattr(user, "status", "active") == "banned":
        raise HTTPException(status_code=403, detail="This account has been banned.")
    if getattr(user, "status", "active") == "suspended":
        reason = getattr(user, "suspension_reason", None)
        detail = "This account is suspended."
        if reason:
            detail += f" Reason: {reason}"
        raise HTTPException(status_code=403, detail=detail)

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ── GET /auth/me ──────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_mongo(current_user)


# ── GET /auth/users/search ────────────────────────────────────────────────────
@router.get("/users/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
):
    # Find users whose name or email contains the search term (case-insensitive)
    all_users = await User.find_all().to_list()
    q_lower = q.lower()
    results = [
        u for u in all_users
        if (q_lower in u.full_name.lower() or q_lower in u.email.lower())
        and str(u.id) != str(current_user.id)  # exclude self
    ]
    return [UserResponse.from_mongo(u) for u in results[:10]]  # max 10 results


class HairProfileUpdate(BM):
    full_name: Opt[str] = None
    hair_type: Opt[str] = None
    hair_porosity: Opt[str] = None
    hair_density: Opt[str] = None
    hair_pattern: Opt[str] = None
    hair_length: Opt[str] = None
    hair_goals: Opt[List[str]] = None
    hair_treatments: Opt[List[str]] = None
    avatar_url: Opt[str] = None
    date_of_birth: Opt[date] = None  # one-time backfill for pre-existing accounts


@router.patch("/me")
async def update_me(
    updates: HairProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    data = updates.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(current_user, key, value)

    # Recompute age_verified whenever date_of_birth is set or changed
    if "date_of_birth" in data:
        age = calculate_age(current_user.date_of_birth)
        current_user.age_verified = age >= MINIMUM_AGE

    await current_user.save()
    return UserResponse.from_mongo(current_user)