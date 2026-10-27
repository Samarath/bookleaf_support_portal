from fastapi import Request, HTTPException, Depends


def get_current_user(request: Request):
    email = request.headers.get("X-User-Email")
    role = request.headers.get("X-User-Role")

    if not email or not role:
        raise HTTPException(status_code=401, detail="Authentication headers missing")

    return {
        "email": email,
        "role": role,
        "author_id": request.headers.get("X-Author-ID")
    }


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    return user


def verify_author_ownership(author_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "ADMIN":
        return user
    if user["role"] == "AUTHOR" and user.get("author_id") != author_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot access other authors' data")
    return user