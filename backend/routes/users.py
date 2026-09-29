from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_user, hash_password, verify_password
from ..database import get_db
from ..models import User
from ..schemas import DeleteAccountRequest, PasswordChangeRequest, ProfileUpdate, UserProfileResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == profile_data.email, User.id != current_user.id)
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use")

    current_user.name = profile_data.name
    current_user.email = profile_data.email
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use")
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.password_hash = hash_password(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.delete("/me")
def delete_account(
    account_data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(account_data.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")

    db.delete(current_user)
    db.commit()
    return {"message": "Your account has been deleted"}