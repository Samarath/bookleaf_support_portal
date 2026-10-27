from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from models import TicketCreate, Ticket
from llm import process_ticket
from services import TicketService
from dependencies import get_current_user, require_admin, verify_author_ownership
from websocket import manager

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("")
async def get_all_tickets(user: dict = Depends(require_admin)):
    return await TicketService.get_all_tickets()


@router.get("/author/{author_id}")
async def get_author_tickets(author_id: str, user: dict = Depends(verify_author_ownership)):
    return await TicketService.get_tickets_by_author(author_id)


@router.post("")
async def create_ticket(ticket_in: TicketCreate, user: dict = Depends(get_current_user)):
    ai_result = await process_ticket(ticket_in.description)

    ticket_doc = Ticket(
        author_id=ticket_in.author_id,
        book_id=ticket_in.book_id,
        subject=ticket_in.subject,
        description=ticket_in.description,
        ai_category=ai_result["category"],
        ai_priority_score=ai_result["priority"],
        ai_draft_response=ai_result["draft"],
        created_at=datetime.utcnow().isoformat()
    )

    new_ticket = await TicketService.create_ticket(ticket_doc.model_dump())
    await manager.broadcast({"type": "NEW_TICKET", "ticket": new_ticket})
    return {"message": "Ticket created", "ticket": new_ticket}


@router.put("/{ticket_id}")
async def update_ticket(ticket_id: str, updates: dict, user: dict = Depends(require_admin)):
    if not ObjectId.is_valid(ticket_id):
        raise HTTPException(status_code=400, detail="Invalid ticket ID")

    result = await TicketService.update_ticket(ticket_id, updates)
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found or no changes made")

    return {"message": "Ticket updated successfully"}