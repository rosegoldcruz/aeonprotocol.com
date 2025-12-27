"""Authentication router."""

from datetime import datetime
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr

from ..middleware.auth import get_current_user, get_current_user_id
from ..middleware.metrics import record_credits_credited

logger = structlog.get_logger()

router = APIRouter()


class UserProfile(BaseModel):
    """User profile model."""
    id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "user"
    created_at: datetime
    updated_at: datetime


class UserPreferences(BaseModel):
    """User preferences model."""
    timezone: str = "UTC"
    email_notifications: bool = True
    webhook_notifications: bool = False
    default_video_style: Optional[str] = None
    default_image_style: Optional[str] = None
    default_music_genre: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    """Update profile request model."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    phone: Optional[str] = None


class UpdatePreferencesRequest(BaseModel):
    """Update preferences request model."""
    timezone: Optional[str] = None
    email_notifications: Optional[bool] = None
    webhook_notifications: Optional[bool] = None
    default_video_style: Optional[str] = None
    default_image_style: Optional[str] = None
    default_music_genre: Optional[str] = None


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's profile information."""
    user_id = get_current_user_id(request)
    
    # TODO: Fetch user profile from database
    # For now, return mock data based on JWT claims
    
    logger.info("Fetching user profile", user_id=user_id)
    
    return UserProfile(
        id=current_user.get("sub"),
        email=current_user.get("email", "user@example.com"),
        first_name=current_user.get("given_name"),
        last_name=current_user.get("family_name"),
        avatar_url=current_user.get("picture"),
        role=current_user.get("role", "user"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    request: Request,
    profile_data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile information."""
    user_id = get_current_user_id(request)
    
    logger.info("Updating user profile", user_id=user_id, updates=profile_data.dict(exclude_unset=True))
    
    # TODO: Update user profile in database
    
    # Return updated profile
    return UserProfile(
        id=current_user.get("sub"),
        email=current_user.get("email", "user@example.com"),
        first_name=profile_data.first_name or current_user.get("given_name"),
        last_name=profile_data.last_name or current_user.get("family_name"),
        avatar_url=current_user.get("picture"),
        role=current_user.get("role", "user"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.get("/me/preferences", response_model=UserPreferences)
async def get_user_preferences(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's preferences."""
    user_id = get_current_user_id(request)
    
    logger.info("Fetching user preferences", user_id=user_id)
    
    # TODO: Fetch preferences from database
    
    return UserPreferences()


@router.put("/me/preferences", response_model=UserPreferences)
async def update_user_preferences(
    request: Request,
    preferences_data: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's preferences."""
    user_id = get_current_user_id(request)
    
    logger.info("Updating user preferences", user_id=user_id, updates=preferences_data.dict(exclude_unset=True))
    
    # TODO: Update preferences in database
    
    # Return updated preferences
    return UserPreferences(
        timezone=preferences_data.timezone or "UTC",
        email_notifications=preferences_data.email_notifications or True,
        webhook_notifications=preferences_data.webhook_notifications or False,
        default_video_style=preferences_data.default_video_style,
        default_image_style=preferences_data.default_image_style,
        default_music_genre=preferences_data.default_music_genre
    )


@router.post("/me/onboard")
async def complete_onboarding(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Complete user onboarding process."""
    user_id = get_current_user_id(request)
    
    logger.info("Completing user onboarding", user_id=user_id)
    
    # TODO: Mark onboarding as completed in database
    # TODO: Award signup credits
    
    # Award signup bonus credits
    signup_credits = 1000  # 1000 credits for new users
    record_credits_credited(signup_credits, "signup_bonus", current_user.get("role", "user"))
    
    logger.info("Awarded signup credits", user_id=user_id, credits=signup_credits)
    
    return {
        "status": "completed",
        "credits_awarded": signup_credits,
        "message": "Welcome to AEON Protocol! You've received 1000 bonus credits."
    }


@router.delete("/me")
async def delete_user_account(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete current user's account (GDPR compliance)."""
    user_id = get_current_user_id(request)
    
    logger.warning("User account deletion requested", user_id=user_id)
    
    # TODO: Implement account deletion logic
    # - Cancel subscriptions
    # - Delete user data
    # - Anonymize audit logs
    # - Delete from Clerk
    
    return {
        "status": "deletion_scheduled",
        "message": "Your account deletion has been scheduled. All data will be removed within 30 days."
    }