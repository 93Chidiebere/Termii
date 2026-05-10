from fastapi import APIRouter, Depends
from typing import List
from app.models.user import User
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_twins(current_user: User = Depends(get_current_user)):
    """
    Find users with the same hair_type as the current user.
    """
    if not current_user.hair_type:
        return []
    
    # Query users with same hair type, excluding current user
    twins = await User.find(
        User.hair_type == current_user.hair_type,
        User.id != current_user.id
    ).to_list()
    
    return twins
