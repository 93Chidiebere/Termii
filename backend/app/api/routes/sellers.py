from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.services import paystack

router = APIRouter()


class BankInfo(BaseModel):
    name: str
    code: str


# ── GET /sellers/banks — list Nigerian banks ──────────────────────────────────
# Used by the seller-application form to populate the bank dropdown.
@router.get("/banks", response_model=List[BankInfo])
async def list_banks():
    try:
        banks = await paystack.get_bank_list()
        return [BankInfo(name=b["name"], code=b["code"]) for b in banks]
    except Exception:
        raise HTTPException(status_code=502, detail="Could not fetch bank list from Paystack")


# ── POST /sellers/verify-account — verify bank account before applying ────────
# Used by the seller-application form before submission.
@router.post("/verify-account")
async def verify_account(bank_code: str, account_number: str):
    result = await paystack.verify_bank_account(account_number, bank_code)
    if not result:
        raise HTTPException(status_code=400, detail="Could not verify this bank account. Check the number and bank.")
    return result  # { account_name, account_number }