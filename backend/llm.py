import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are BookLeaf Publishing's AI support assistant.
Classify the query into: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, or General Inquiry.
Assign priority: Critical, High, Medium, Low (e.g., ISBN errors and missing royalties are High/Critical).
Draft a professional response using this Knowledge Base:
- 80/20 royalty split. Payouts quarterly within 45 days. Minimum ₹1,000 threshold.
- ISBNs assigned by BookLeaf. ISBN errors escalate immediately.
- Print turnaround: 5-7 business days. Free reprint for defects (requires photos).
- Stock issues sync in 24-48 hours.
Acknowledge the concern, provide timelines, and state the next step.
Output ONLY raw JSON: {"category": "...", "priority": "...", "draft": "..."}
"""

async def process_ticket(description: str):
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": description}
            ],
            model="openai/gpt-oss-20b",
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"category": "General Inquiry", "priority": "Medium", "draft": ""}