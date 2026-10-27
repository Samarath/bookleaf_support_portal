from fastapi import APIRouter, HTTPException
from models import LoginRequest
from services import AuthService

router = APIRouter(tags=["Authentication"])

@router.post("/login")
async def login(credentials: LoginRequest):
    if credentials.email == "admin@bookleafpub.in":
        return {
            "role": "ADMIN",
            "user": {"author_id": "ADMIN", "name": "BookLeaf Operations", "email": "admin@bookleafpub.in"}
        }

    author = await AuthService.get_author_by_email(credentials.email)
    if author:
        return {"role": "AUTHOR", "user": author}

    raise HTTPException(status_code=401, detail="Invalid email address")

@router.get("/authors/{email}")
async def get_author(email: str):
    author = await AuthService.get_author_by_email(email)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author