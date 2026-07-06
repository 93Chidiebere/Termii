from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await User.find_one(User.email == email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

async def require_age_verified(current_user: User = Depends(get_current_user)):
    """
    Gate for Marketplace and Messages access.
    Blocks users who are under 16, or who haven't provided a date_of_birth yet
    (pre-existing accounts created before the age-gate was introduced).
    """
    if not getattr(current_user, "date_of_birth", None):
        raise HTTPException(
            status_code=403,
            detail="Please confirm your date of birth to access this feature.",
        )
    if not getattr(current_user, "age_verified", False):
        raise HTTPException(
            status_code=403,
            detail="You must be 16 or older to access this feature.",
        )
    return current_user