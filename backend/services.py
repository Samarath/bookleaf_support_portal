from bson import ObjectId
from database import db

class TicketService:
    @staticmethod
    async def get_all_tickets():
        cursor = db.tickets.find({})
        return [{**doc, "_id": str(doc["_id"])} for doc in await cursor.to_list(length=100)]

    @staticmethod
    async def get_tickets_by_author(author_id: str):
        cursor = db.tickets.find({"author_id": author_id})
        return [{**doc, "_id": str(doc["_id"])} for doc in await cursor.to_list(length=100)]

    @staticmethod
    async def create_ticket(ticket_data: dict):
        result = await db.tickets.insert_one(ticket_data)
        ticket_data["_id"] = str(result.inserted_id)
        return ticket_data

    @staticmethod
    async def update_ticket(ticket_id: str, updates: dict):
        return await db.tickets.update_one({"_id": ObjectId(ticket_id)}, {"$set": updates})

class AuthService:
    @staticmethod
    async def get_author_by_email(email: str):
        return await db.authors.find_one({"email": email}, {"_id": 0})