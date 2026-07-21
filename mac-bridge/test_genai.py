import asyncio
from google import genai

async def main():
    client = genai.Client()
    chat = client.aio.chats.create(model="gemini-2.5-flash")
    stream = await chat.send_message_stream("Hello, say 'test'")
    async for chunk in stream:
        print(chunk.text, end="")
    print()

asyncio.run(main())
