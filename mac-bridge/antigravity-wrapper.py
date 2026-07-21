import sys
import asyncio
import time

from google.antigravity import Agent, LocalAgentConfig

async def main():
    if len(sys.argv) < 2:
        return

    command = sys.argv[1]

    if command == "status":
        print('{"status": "online", "version": "1.0.0", "sdk": "google_antigravity"}')
        return

    if command == "chat":
        message = sys.argv[2]
        
        async with Agent(LocalAgentConfig()) as agent:
            response = await agent.chat(message)
            buffer = ""
            last_flush = time.time()
            async for token in response:
                buffer += token
                if time.time() - last_flush > 0.05:
                    print(buffer, end="", flush=True)
                    buffer = ""
                    last_flush = time.time()
            if buffer:
                print(buffer, end="", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
