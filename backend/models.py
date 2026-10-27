from pydantic import BaseModel, Field
from typing import Optional, List

class Book(BaseModel):
    book_id: str
    title: str
    isbn: str
    genre: str
    status: str
    mrp: Optional[int] = None
    author_royalty_per_copy: Optional[int] = None
    total_copies_sold: int
    total_royalty_earned: int
    royalty_paid: int
    royalty_pending: int
    last_royalty_payout_date: Optional[str] = None
    print_partner: Optional[str] = None
    available_on: List[str] = []

class Author(BaseModel):
    author_id: str
    name: str
    email: str
    phone: str
    city: str
    joined_date: str
    books: List[Book] = []

class TicketCreate(BaseModel):
    author_id: str
    book_id: Optional[str] = "General / Account Level"
    subject: str
    description: str

class Ticket(BaseModel):
    author_id: str
    book_id: Optional[str]
    subject: str
    description: str
    status: str = "Open"
    ai_category: str
    ai_priority_score: str
    ai_draft_response: str
    created_at: str

class LoginRequest(BaseModel):
    email: str
    password: str = "" # Optional, included to fulfill standard frontend login form structures