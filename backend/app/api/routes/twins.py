from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.models.user import User
from app.api.dependencies import get_current_user

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
    score = 0.0
    shared_traits = []

    # ── Hair type (up to 0.45) ────────────────────────────────────────────────
    if current.hair_type and candidate.hair_type:
        c_type = current.hair_type.upper()
        t_type = candidate.hair_type.upper()
        if c_type == t_type:
            score += 0.45
            shared_traits.append(f"Type {c_type}")
        elif c_type[0] == t_type[0]:
            score += 0.25
            shared_traits.append(f"Type {c_type[0]}x family")
        else:
            score += 0.05

    # ── Porosity (up to 0.15) ─────────────────────────────────────────────────
    if current.hair_porosity and candidate.hair_porosity:
        if current.hair_porosity == candidate.hair_porosity:
            score += 0.15
            shared_traits.append(f"{current.hair_porosity} Porosity")

    # ── Density (up to 0.10) ──────────────────────────────────────────────────
    if current.hair_density and candidate.hair_density:
        if current.hair_density == candidate.hair_density:
            score += 0.10
            shared_traits.append(f"{current.hair_density} Density")

    # ── Pattern (up to 0.10) ──────────────────────────────────────────────────
    if current.hair_pattern and candidate.hair_pattern:
        if current.hair_pattern == candidate.hair_pattern:
            score += 0.10
            shared_traits.append(f"{current.hair_pattern} Pattern")

    # ── Shared goals (up to 0.15, 0.05 per shared goal, max 3) ───────────────
    if current.hair_goals and candidate.hair_goals:
        shared_goals = set(current.hair_goals) & set(candidate.hair_goals)
        goal_score = min(len(shared_goals) * 0.05, 0.15)
        score += goal_score
        for g in list(shared_goals)[:2]:
            shared_traits.append(g)

    # ── Coily/curly family bonus (up to 0.05) ─────────────────────────────────
    coily = {"4A", "4B", "4C"}
    curly = {"3A", "3B", "3C"}
    if current.hair_type and candidate.hair_type:
        c_up = current.hair_type.upper()
        t_up = candidate.hair_type.upper()
        if c_up in coily and t_up in coily:
            score += 0.05
            if "Coily Hair" not in shared_traits:
                shared_traits.append("Coily Hair")
        elif c_up in curly and t_up in curly:
            score += 0.05
            if "Curly Hair" not in shared_traits:
                shared_traits.append("Curly Hair")

    score = min(score, 1.0)

    if not shared_traits:
        shared_traits.append("Natural Hair")

    return round(score, 2), shared_traits


@router.get("/", response_model=List[HairTwinResponse])
async def get_twins(current_user: User = Depends(get_current_user)):
    all_users = await User.find(User.id != current_user.id).to_list()  # type: ignore
    results = []
    for candidate in all_users:
        score, shared_traits = compute_match(current_user, candidate)
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
    results.sort(key=lambda x: x.match_score, reverse=True)
    return results