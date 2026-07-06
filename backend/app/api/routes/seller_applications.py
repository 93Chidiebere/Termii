from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.models.user import User
from app.models.seller_application import SellerApplication
from app.schemas.seller_application import (
    SellerApplicationCreate,
    SellerApplicationResponse,
    SellerApplicationAdminView,
    SellerApplicationReviewRequest,
)
from app.api.dependencies import get_current_user, get_current_admin
from app.services import paystack

router = APIRouter()

INDIVIDUAL_FEE_NAIRA = 25_000
CORPORATE_FEE_NAIRA = 100_000
CALLBACK_URL = "https://isingala.com/seller-application/callback"


def _to_response(app: SellerApplication) -> SellerApplicationResponse:
    return SellerApplicationResponse(
        id=str(app.id),
        seller_type=app.seller_type,
        full_name=app.full_name,
        business_name=app.business_name,
        id_verification_status=app.id_verification_status,
        cac_verification_status=app.cac_verification_status,
        fee_amount=app.fee_amount,
        payment_status=app.payment_status,
        status=app.status,
        rejection_reason=app.rejection_reason,
        created_at=app.created_at,
        reviewed_at=app.reviewed_at,
    )


# ── POST /seller-applications/apply ───────────────────────────────────────────
@router.post("/apply")
async def apply_for_seller(
    application_in: SellerApplicationCreate,
    current_user: User = Depends(get_current_user),
):
    if getattr(current_user, "is_seller", False):
        raise HTTPException(status_code=400, detail="You are already a verified seller.")

    existing = await SellerApplication.find(
        SellerApplication.applicant.id == current_user.id,  # type: ignore
        SellerApplication.status.in_(["pending_payment", "pending_review"]),
    ).first_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have an application in progress.",
        )

    if application_in.seller_type not in ("individual", "business"):
        raise HTTPException(status_code=400, detail="seller_type must be 'individual' or 'business'")

    if application_in.seller_type == "individual" and not application_in.nin_or_bvn:
        raise HTTPException(status_code=400, detail="NIN or BVN is required for individual sellers")

    if application_in.seller_type == "business":
        if not application_in.business_name:
            raise HTTPException(status_code=400, detail="business_name is required for business sellers")
        if not application_in.cac_number:
            raise HTTPException(status_code=400, detail="cac_number is required for business sellers")

    # Verify bank account is real before accepting the application
    account_info = await paystack.verify_bank_account(
        application_in.bank_account_number, application_in.bank_code
    )
    if not account_info:
        raise HTTPException(status_code=400, detail="Could not verify bank account details")

    fee_amount = (
        CORPORATE_FEE_NAIRA if application_in.seller_type == "business" else INDIVIDUAL_FEE_NAIRA
    )

    account_age_days = (datetime.utcnow() - current_user.created_at).days

    application = SellerApplication(
        applicant=current_user,
        seller_type=application_in.seller_type,
        full_name=application_in.full_name,
        phone_number=application_in.phone_number,
        address=application_in.address,
        nin_or_bvn=application_in.nin_or_bvn,
        id_verification_status="pending" if application_in.seller_type == "individual" else None,
        business_name=application_in.business_name,
        cac_number=application_in.cac_number,
        cac_verification_status="pending" if application_in.seller_type == "business" else None,
        tin=application_in.tin,
        bank_code=application_in.bank_code,
        bank_account_number=application_in.bank_account_number,
        bank_account_name=account_info.get("account_name", application_in.bank_account_name),
        portfolio_image_urls=application_in.portfolio_image_urls,
        fee_amount=fee_amount,
        payment_status="pending",
        status="pending_payment",
        account_age_days_at_apply=account_age_days,
    )
    await application.insert()

    reference = f"selapp_{uuid.uuid4().hex[:16]}"
    transaction = await paystack.initialize_transaction(
        email=current_user.email,
        amount_kobo=fee_amount * 100,
        reference=reference,
        callback_url=CALLBACK_URL,
    )
    if not transaction:
        await application.delete()
        raise HTTPException(status_code=502, detail="Could not initialize payment. Please try again.")

    application.payment_reference = reference
    await application.save()

    return {
        "application_id": str(application.id),
        "authorization_url": transaction.get("authorization_url"),
        "reference": reference,
    }


# ── GET /seller-applications/verify/{reference} — confirm payment, move to review ──
@router.get("/verify/{reference}", response_model=SellerApplicationResponse)
async def verify_application_payment(
    reference: str,
    current_user: User = Depends(get_current_user),
):
    application = await SellerApplication.find_one(
        SellerApplication.payment_reference == reference
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.payment_status == "paid":
        return _to_response(application)

    result = await paystack.verify_transaction(reference)
    if not result or result.get("status") != "success":
        application.payment_status = "failed"
        await application.save()
        raise HTTPException(status_code=400, detail="Payment could not be verified.")

    application.payment_status = "paid"
    application.status = "pending_review"
    await application.save()

    return _to_response(application)


# ── GET /seller-applications/me — applicant checks their own status ───────────
@router.get("/me", response_model=Optional[SellerApplicationResponse])
async def get_my_application(current_user: User = Depends(get_current_user)):
    application = await SellerApplication.find(
        SellerApplication.applicant.id == current_user.id  # type: ignore
    ).sort(-SellerApplication.created_at).first_or_none()

    if not application:
        return None
    return _to_response(application)


# ── Admin: GET /seller-applications/admin/pending ─────────────────────────────
@router.get("/admin/pending", response_model=List[SellerApplicationAdminView])
async def list_pending_applications(admin: User = Depends(get_current_admin)):
    applications = await SellerApplication.find(
        SellerApplication.status == "pending_review"
    ).sort(SellerApplication.created_at).to_list()

    result = []
    for app in applications:
        await app.fetch_link(SellerApplication.applicant)
        applicant = app.applicant
        if not hasattr(applicant, "id"):
            continue
        result.append(SellerApplicationAdminView(
            id=str(app.id),
            seller_type=app.seller_type,
            full_name=app.full_name,
            business_name=app.business_name,
            id_verification_status=app.id_verification_status,
            cac_verification_status=app.cac_verification_status,
            fee_amount=app.fee_amount,
            payment_status=app.payment_status,
            status=app.status,
            rejection_reason=app.rejection_reason,
            created_at=app.created_at,
            reviewed_at=app.reviewed_at,
            applicant_id=str(applicant.id),
            applicant_email=applicant.email,
            phone_number=app.phone_number,
            address=app.address,
            bank_code=app.bank_code,
            bank_account_number=app.bank_account_number,
            bank_account_name=app.bank_account_name,
            portfolio_image_urls=app.portfolio_image_urls,
            account_age_days_at_apply=app.account_age_days_at_apply,
            payment_reference=app.payment_reference,
        ))
    return result


# ── Admin: POST /seller-applications/admin/{id}/review ────────────────────────
@router.post("/admin/{application_id}/review")
async def review_application(
    application_id: str,
    review: SellerApplicationReviewRequest,
    admin: User = Depends(get_current_admin),
):
    application = await SellerApplication.get(application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status != "pending_review":
        raise HTTPException(status_code=400, detail="This application is not awaiting review.")

    if review.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="decision must be 'approve' or 'reject'")

    if review.decision == "reject" and not review.rejection_reason:
        raise HTTPException(status_code=400, detail="rejection_reason is required when rejecting")

    await application.fetch_link(SellerApplication.applicant)
    applicant = application.applicant
    if not hasattr(applicant, "id"):
        raise HTTPException(status_code=404, detail="Applicant no longer exists")

    if review.decision == "reject":
        application.status = "rejected"
        application.rejection_reason = review.rejection_reason
    else:
        display_name = application.business_name or applicant.full_name
        subaccount = await paystack.create_subaccount(
            business_name=display_name,
            bank_code=application.bank_code,
            account_number=application.bank_account_number,
        )
        if not subaccount:
            raise HTTPException(status_code=502, detail="Could not create seller payment account. Try again.")

        applicant.seller_type = application.seller_type
        applicant.business_name = application.business_name
        applicant.cac_number = application.cac_number
        applicant.bank_code = application.bank_code
        applicant.bank_account_number = application.bank_account_number
        applicant.bank_account_name = application.bank_account_name
        applicant.paystack_subaccount_code = subaccount.get("subaccount_code")
        applicant.verification_status = "verified"
        applicant.is_seller = True
        applicant.badge_issued_at = datetime.utcnow()
        applicant.badge_expires_at = datetime.utcnow() + timedelta(days=365)
        applicant.listing_cap = -1 if application.seller_type == "business" else 20
        await applicant.save()

        application.status = "approved"

    # Manual review point reached — clear the sensitive ID field regardless of outcome
    application.nin_or_bvn = None
    application.id_verification_status = "manually_reviewed" if application.id_verification_status else None
    application.cac_verification_status = "manually_reviewed" if application.cac_verification_status else None
    application.reviewed_by = admin
    application.reviewed_at = datetime.utcnow()
    await application.save()

    return {"status": application.status}