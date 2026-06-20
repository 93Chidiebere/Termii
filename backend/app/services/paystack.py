import httpx
from app.core.config import settings

PAYSTACK_BASE_URL = "https://api.paystack.co"


def _headers():
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


async def get_bank_list():
    """Fetch list of Nigerian banks with their Paystack bank codes."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{PAYSTACK_BASE_URL}/bank?country=nigeria",
            headers=_headers(),
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])


async def verify_bank_account(account_number: str, bank_code: str):
    """Verify that an account number matches a real bank account and get the account name."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{PAYSTACK_BASE_URL}/bank/resolve",
            headers=_headers(),
            params={"account_number": account_number, "bank_code": bank_code},
        )
        if response.status_code != 200:
            return None
        data = response.json()
        return data.get("data")  # contains account_name, account_number


async def create_subaccount(
    business_name: str,
    bank_code: str,
    account_number: str,
    percentage_charge: float = 10.0,
):
    """
    Create a Paystack subaccount for a seller.
    percentage_charge is Termii's commission percentage (10% default).
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYSTACK_BASE_URL}/subaccount",
            headers=_headers(),
            json={
                "business_name": business_name,
                "settlement_bank": bank_code,
                "account_number": account_number,
                "percentage_charge": percentage_charge,
            },
        )
        if response.status_code not in (200, 201):
            return None
        data = response.json()
        return data.get("data")  # contains subaccount_code