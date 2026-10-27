import asyncio
import json
from database import db


async def seed_data():
    with open("bookleaf_sample_data.json", "r") as file:
        data = json.load(file)

    await db.authors.delete_many({})

    if data.get("authors"):
        await db.authors.insert_many(data["authors"])
        print(f"Successfully inserted {len(data['authors'])} authors.")


if __name__ == "__main__":
    asyncio.run(seed_data())