from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()


class HairTwinResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    hair_type: Optional[str] = None
    match_score: float
    shared_traits: List[str]


def compute_match(current: User, candidate: User) -> tuple[float, List[str]]:
    """
    Score how closely two users' hair profiles match.
    Returns (score between 0-1, list of shared trait labels).
    """
    score = 0.0
    shared_traits = []

    # Hair type match — most important factor (up to 0.6)
    if current.hair_type and candidate.hair_type:
        c_type = current.hair_type.upper()
        t_type = candidate.hair_type.upper()

        if c_type == t_type:
            # Exact match e.g. both 4C
            score += 0.60
            shared_traits.append(f"Type {c_type}")
        elif c_type[0] == t_type[0]:
            # Same number group e.g. 4B vs 4C
            score += 0.35
            shared_traits.append(f"Type {c_type[0]}x family")
        else:
            # Different group — low base score
            score += 0.10

    # Bonus: both are in the coily range (4A/4B/4C) — +0.15
    coily_types = {"4A", "4B", "4C"}
    if (
        current.hair_type and candidate.hair_type
        and current.hair_type.upper() in coily_types
        and candidate.hair_type.upper() in coily_types
    ):
        score += 0.15
        if "Coily Hair" not in shared_traits:
            shared_traits.append("Coily Hair")

    # Bonus: both are in the curly range (3A/3B/3C) — +0.15
    curly_types = {"3A", "3B", "3C"}
    if (
        current.hair_type and candidate.hair_type
        and current.hair_type.upper() in curly_types
        and candidate.hair_type.upper() in curly_types
    ):
        score += 0.15
        if "Curly Hair" not in shared_traits:
            shared_traits.append("Curly Hair")

    # Bonus: same African region inferred from email domain — +0.10
    # (rough proxy until we store location properly)
    african_domains = [".ng", ".gh", ".ke", ".za", ".tz", ".ug", ".rw"]
    current_african = any(current.email.endswith(d) for d in african_domains)
    candidate_african = any(candidate.email.endswith(d) for d in african_domains)
    if current_african and candidate_african:
        score += 0.10
        shared_traits.append("African Hair Community")

    # Cap score at 1.0
    score = min(score, 1.0)

    # Always show at least something in shared traits
    if not shared_traits and current.hair_type:
        shared_traits.append(f"Natural Hair")

    return round(score, 2), shared_traits


# ── GET /twins/ ───────────────────────────────────────────────────────────────
@router.get("/", response_model=List[HairTwinResponse])
async def get_twins(current_user: User = Depends(get_current_user)):
    # Get all users except current user
    all_users = await User.find(User.id != current_user.id).to_list()

    results = []
    for candidate in all_users:
        score, shared_traits = compute_match(current_user, candidate)
        # Only include users with at least 10% match
        if score >= 0.10:
            results.append(HairTwinResponse(
                user_id=str(candidate.id),
                email=candidate.email,
                full_name=candidate.full_name,
                avatar_url=candidate.avatar_url,
                hair_type=candidate.hair_type,
                match_score=score,
                shared_traits=shared_traits,
            ))

    # Sort by match score descending
    results.sort(key=lambda x: x.match_score, reverse=True)
    return results