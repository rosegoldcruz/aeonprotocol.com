"""Webhook handlers router."""

import hashlib
import hmac
import json
from typing import Any, Dict

import structlog
from fastapi import APIRouter, HTTPException, Request, Response

from ..config import settings
from ..middleware.metrics import record_credits_credited

logger = structlog.get_logger()

router = APIRouter()


async def verify_stripe_signature(request: Request, payload: bytes) -> bool:
    """Verify Stripe webhook signature."""
    signature_header = request.headers.get("stripe-signature")
    if not signature_header:
        return False
    
    try:
        # Parse signature header
        signatures = {}
        for pair in signature_header.split(","):
            key, value = pair.split("=", 1)
            signatures[key] = value
        
        # Get timestamp and signature
        timestamp = signatures.get("t")
        signature = signatures.get("v1")
        
        if not timestamp or not signature:
            return False
        
        # Create expected signature
        signed_payload = f"{timestamp}.{payload.decode()}"
        expected_signature = hmac.new(
            settings.stripe_webhook_secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(signature, expected_signature)
        
    except Exception as e:
        logger.error("Error verifying Stripe signature", error=str(e))
        return False


async def verify_coinbase_signature(request: Request, payload: bytes) -> bool:
    """Verify Coinbase Commerce webhook signature."""
    signature_header = request.headers.get("x-cc-webhook-signature")
    if not signature_header:
        return False
    
    try:
        # Create expected signature
        expected_signature = hmac.new(
            settings.coinbase_commerce_webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(signature_header, expected_signature)
        
    except Exception as e:
        logger.error("Error verifying Coinbase signature", error=str(e))
        return False


async def log_webhook_event(source: str, event_type: str, event_id: str, payload: Dict[str, Any]) -> None:
    """Log webhook event to database."""
    logger.info("Webhook event received", source=source, event_type=event_type, event_id=event_id)
    
    # TODO: Store webhook event in database for debugging and replay protection
    # This should check for duplicate events and prevent replay attacks


@router.post("/stripe")
async def handle_stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    # Get raw payload
    payload = await request.body()
    
    # Verify signature
    if not await verify_stripe_signature(request, payload):
        logger.warning("Invalid Stripe webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    try:
        # Parse JSON payload
        event = json.loads(payload.decode())
        event_type = event["type"]
        event_id = event["id"]
        
        # Log event
        await log_webhook_event("stripe", event_type, event_id, event)
        
        # Handle different event types
        if event_type == "invoice.payment_succeeded":
            await handle_invoice_payment_succeeded(event)
        elif event_type == "customer.subscription.created":
            await handle_subscription_created(event)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event)
        elif event_type == "checkout.session.completed":
            await handle_checkout_session_completed(event)
        else:
            logger.info("Unhandled Stripe event type", event_type=event_type)
        
        return {"status": "success"}
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in Stripe webhook")
        raise HTTPException(status_code=400, detail="Invalid JSON")
    except Exception as e:
        logger.error("Error processing Stripe webhook", error=str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.post("/coinbase")
async def handle_coinbase_webhook(request: Request):
    """Handle Coinbase Commerce webhook events."""
    # Get raw payload
    payload = await request.body()
    
    # Verify signature
    if not await verify_coinbase_signature(request, payload):
        logger.warning("Invalid Coinbase webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    try:
        # Parse JSON payload
        event = json.loads(payload.decode())
        event_type = event["type"]
        event_id = event["id"]
        
        # Log event
        await log_webhook_event("coinbase", event_type, event_id, event)
        
        # Handle different event types
        if event_type == "charge:confirmed":
            await handle_charge_confirmed(event)
        elif event_type == "charge:failed":
            await handle_charge_failed(event)
        elif event_type == "charge:delayed":
            await handle_charge_delayed(event)
        else:
            logger.info("Unhandled Coinbase event type", event_type=event_type)
        
        return {"status": "success"}
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in Coinbase webhook")
        raise HTTPException(status_code=400, detail="Invalid JSON")
    except Exception as e:
        logger.error("Error processing Coinbase webhook", error=str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def handle_invoice_payment_succeeded(event: Dict[str, Any]) -> None:
    """Handle successful invoice payment."""
    invoice = event["data"]["object"]
    customer_id = invoice["customer"]
    amount_paid = invoice["amount_paid"]
    
    logger.info("Invoice payment succeeded", customer_id=customer_id, amount_paid=amount_paid)
    
    # TODO: Find user by Stripe customer ID
    # TODO: Award credits based on subscription plan
    # TODO: Update subscription status if needed
    
    # Mock credit award
    credits_to_award = amount_paid  # 1 cent = 1 credit
    record_credits_credited(credits_to_award, "subscription_payment")


async def handle_subscription_created(event: Dict[str, Any]) -> None:
    """Handle new subscription creation."""
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    plan_id = subscription["items"]["data"][0]["price"]["id"]
    
    logger.info("Subscription created", customer_id=customer_id, plan_id=plan_id)
    
    # TODO: Find user by Stripe customer ID
    # TODO: Create subscription record in database
    # TODO: Award initial credits if applicable


async def handle_subscription_updated(event: Dict[str, Any]) -> None:
    """Handle subscription updates."""
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    status = subscription["status"]
    
    logger.info("Subscription updated", customer_id=customer_id, status=status)
    
    # TODO: Update subscription in database
    # TODO: Handle plan changes, cancellations, etc.


async def handle_subscription_deleted(event: Dict[str, Any]) -> None:
    """Handle subscription deletion."""
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    
    logger.info("Subscription deleted", customer_id=customer_id)
    
    # TODO: Update subscription status in database
    # TODO: Send cancellation email


async def handle_checkout_session_completed(event: Dict[str, Any]) -> None:
    """Handle completed checkout session."""
    session = event["data"]["object"]
    customer_id = session["customer"]
    amount_total = session["amount_total"]
    mode = session["mode"]
    
    logger.info("Checkout session completed", customer_id=customer_id, amount_total=amount_total, mode=mode)
    
    if mode == "payment":  # One-time credit purchase
        # TODO: Award credits for one-time purchase
        credits_to_award = amount_total  # 1 cent = 1 credit
        record_credits_credited(credits_to_award, "credit_purchase")


async def handle_charge_confirmed(event: Dict[str, Any]) -> None:
    """Handle confirmed crypto payment."""
    charge = event["data"]
    charge_id = charge["id"]
    amount_usd = float(charge["pricing"]["local"]["amount"])
    
    logger.info("Crypto charge confirmed", charge_id=charge_id, amount_usd=amount_usd)
    
    # TODO: Find crypto payment record by charge ID
    # TODO: Award credits to user
    # TODO: Mark payment as confirmed
    
    # Mock credit award
    credits_to_award = int(amount_usd * 100)  # Convert to cents, then to credits
    record_credits_credited(credits_to_award, "crypto_payment")


async def handle_charge_failed(event: Dict[str, Any]) -> None:
    """Handle failed crypto payment."""
    charge = event["data"]
    charge_id = charge["id"]
    
    logger.info("Crypto charge failed", charge_id=charge_id)
    
    # TODO: Update payment status in database
    # TODO: Send failure notification


async def handle_charge_delayed(event: Dict[str, Any]) -> None:
    """Handle delayed crypto payment."""
    charge = event["data"]
    charge_id = charge["id"]
    
    logger.info("Crypto charge delayed", charge_id=charge_id)
    
    # TODO: Update payment status in database
    # TODO: Monitor for eventual confirmation