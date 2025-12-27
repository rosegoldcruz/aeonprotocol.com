"""Billing and subscription router."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..middleware.auth import get_current_user, get_current_user_id

logger = structlog.get_logger()

router = APIRouter()


class SubscriptionPlan(BaseModel):
    """Subscription plan model."""
    id: str
    name: str
    display_name: str
    description: str
    price_monthly: int  # Price in cents
    price_yearly: int   # Price in cents
    credits_monthly: int
    features: List[str]
    popular: bool = False


class UserSubscription(BaseModel):
    """User subscription model."""
    id: UUID
    plan_name: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    monthly_credits: int
    created_at: datetime


class CreditBalance(BaseModel):
    """Credit balance model."""
    balance: int
    total_earned: int
    total_spent: int
    last_updated: datetime


class Invoice(BaseModel):
    """Invoice model."""
    id: UUID
    invoice_number: str
    amount_paid: int  # Amount in cents
    currency: str
    status: str
    credits_awarded: int
    invoice_pdf_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime


class CheckoutSession(BaseModel):
    """Stripe checkout session model."""
    session_id: str
    url: str
    expires_at: datetime


class CryptoCheckout(BaseModel):
    """Crypto checkout model."""
    charge_id: str
    hosted_url: str
    amount_usd: int
    credits_to_award: int
    expires_at: datetime


# Available subscription plans
SUBSCRIPTION_PLANS = [
    SubscriptionPlan(
        id="basic",
        name="basic",
        display_name="Basic",
        description="Perfect for individuals and small projects",
        price_monthly=1900,  # $19
        price_yearly=19000,  # $190 (save ~17%)
        credits_monthly=1000,
        features=[
            "1,000 credits per month",
            "Video generation up to 60 seconds",
            "Image generation (standard quality)",
            "Music generation up to 2 minutes",
            "Email support",
            "Basic templates"
        ]
    ),
    SubscriptionPlan(
        id="pro",
        name="pro",
        display_name="Pro",
        description="For professionals and growing businesses",
        price_monthly=4900,  # $49
        price_yearly=49000,  # $490 (save ~17%)
        credits_monthly=5000,
        features=[
            "5,000 credits per month",
            "Video generation up to 5 minutes",
            "Image generation (HD quality)",
            "Music generation up to 10 minutes",
            "Priority processing",
            "Advanced templates",
            "API access",
            "Priority support"
        ],
        popular=True
    ),
    SubscriptionPlan(
        id="enterprise",
        name="enterprise",
        display_name="Enterprise",
        description="For large teams and enterprise needs",
        price_monthly=19900,  # $199
        price_yearly=199000,  # $1990 (save ~17%)
        credits_monthly=25000,
        features=[
            "25,000 credits per month",
            "Unlimited video length",
            "Ultra-HD image generation",
            "Extended music generation",
            "Custom models",
            "White-label options",
            "CRM integrations",
            "Dedicated support",
            "SLA guarantee"
        ]
    )
]


@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    """Get available subscription plans."""
    logger.info("Fetching subscription plans")
    return SUBSCRIPTION_PLANS


@router.get("/subscription", response_model=Optional[UserSubscription])
async def get_user_subscription(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user's current subscription."""
    user_id = get_current_user_id(request)
    
    logger.info("Fetching user subscription", user_id=user_id)
    
    # TODO: Fetch subscription from database
    
    # Mock response for now
    return None


@router.get("/credits", response_model=CreditBalance)
async def get_credit_balance(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user's credit balance."""
    user_id = get_current_user_id(request)
    
    logger.info("Fetching credit balance", user_id=user_id)
    
    # TODO: Fetch credits from database
    
    # Mock response for now
    return CreditBalance(
        balance=2500,
        total_earned=5000,
        total_spent=2500,
        last_updated=datetime.utcnow()
    )


@router.post("/subscribe", response_model=CheckoutSession)
async def create_checkout_session(
    request: Request,
    plan_id: str,
    billing_cycle: str = "monthly",  # "monthly" or "yearly"
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription."""
    user_id = get_current_user_id(request)
    
    logger.info("Creating checkout session", user_id=user_id, plan_id=plan_id, billing_cycle=billing_cycle)
    
    # Validate plan
    plan = next((p for p in SUBSCRIPTION_PLANS if p.id == plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    if billing_cycle not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid billing cycle")
    
    # TODO: Create Stripe checkout session
    # TODO: Store session info in database
    
    # Mock response for now
    return CheckoutSession(
        session_id="cs_test_session_123",
        url="https://checkout.stripe.com/pay/cs_test_session_123",
        expires_at=datetime.utcnow()
    )


@router.get("/portal")
async def get_billing_portal_url(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get Stripe billing portal URL."""
    user_id = get_current_user_id(request)
    
    logger.info("Creating billing portal session", user_id=user_id)
    
    # TODO: Create Stripe billing portal session
    # TODO: Return portal URL
    
    # Mock response for now
    return {
        "url": "https://billing.stripe.com/session/portal_123",
        "expires_at": datetime.utcnow()
    }


@router.get("/invoices", response_model=List[Invoice])
async def get_user_invoices(
    request: Request,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get user's invoice history."""
    user_id = get_current_user_id(request)
    
    logger.info("Fetching user invoices", user_id=user_id, limit=limit)
    
    # TODO: Fetch invoices from database
    
    # Mock response for now
    return []


@router.post("/crypto/checkout", response_model=CryptoCheckout)
async def create_crypto_checkout(
    request: Request,
    amount_usd: int,  # Amount in cents
    current_user: dict = Depends(get_current_user)
):
    """Create Coinbase Commerce checkout for crypto payment."""
    user_id = get_current_user_id(request)
    
    logger.info("Creating crypto checkout", user_id=user_id, amount_usd=amount_usd)
    
    if amount_usd < 1000:  # Minimum $10
        raise HTTPException(status_code=400, detail="Minimum purchase amount is $10")
    
    # Calculate credits to award (1 cent = 1 credit)
    credits_to_award = amount_usd
    
    # TODO: Create Coinbase Commerce charge
    # TODO: Store charge info in database
    
    # Mock response for now
    return CryptoCheckout(
        charge_id="charge_test_123",
        hosted_url="https://commerce.coinbase.com/charges/charge_test_123",
        amount_usd=amount_usd,
        credits_to_award=credits_to_award,
        expires_at=datetime.utcnow()
    )


@router.post("/credits/purchase", response_model=CheckoutSession)
async def purchase_credits(
    request: Request,
    amount_usd: int,  # Amount in cents
    current_user: dict = Depends(get_current_user)
):
    """Purchase credits with one-time payment."""
    user_id = get_current_user_id(request)
    
    logger.info("Purchasing credits", user_id=user_id, amount_usd=amount_usd)
    
    if amount_usd < 500:  # Minimum $5
        raise HTTPException(status_code=400, detail="Minimum purchase amount is $5")
    
    # TODO: Create Stripe checkout session for one-time payment
    # TODO: Store session info in database
    
    # Mock response for now
    return CheckoutSession(
        session_id="cs_test_credits_123",
        url="https://checkout.stripe.com/pay/cs_test_credits_123",
        expires_at=datetime.utcnow()
    )


@router.post("/subscription/cancel")
async def cancel_subscription(
    request: Request,
    at_period_end: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Cancel user's subscription."""
    user_id = get_current_user_id(request)
    
    logger.info("Cancelling subscription", user_id=user_id, at_period_end=at_period_end)
    
    # TODO: Cancel subscription in Stripe
    # TODO: Update subscription in database
    
    return {
        "status": "cancelled" if not at_period_end else "will_cancel",
        "message": "Subscription cancelled successfully" if not at_period_end else "Subscription will cancel at the end of the current period"
    }


@router.post("/subscription/reactivate")
async def reactivate_subscription(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Reactivate a cancelled subscription."""
    user_id = get_current_user_id(request)
    
    logger.info("Reactivating subscription", user_id=user_id)
    
    # TODO: Reactivate subscription in Stripe
    # TODO: Update subscription in database
    
    return {
        "status": "reactivated",
        "message": "Subscription reactivated successfully"
    }