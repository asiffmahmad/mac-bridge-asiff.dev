import sys
import asyncio
import time

try:
    from google.antigravity import Agent, LocalAgentConfig
    HAS_SDK = True
except ImportError:
    HAS_SDK = False

async def main():
    if len(sys.argv) < 2:
        return

    command = sys.argv[1]

    if command == "status":
        print('{"status": "online", "version": "1.0.0", "sdk": "google_antigravity"}')
        return

    if command == "chat":
        message = sys.argv[2]
        
        if HAS_SDK:
            async with Agent(LocalAgentConfig()) as agent:
                response = await agent.chat(message)
                async for token in response:
                    print(token, end="", flush=True)
        else:
            # Fallback mock that acts like the real SDK (streams tokens)
            response_text = f"Hello! I am Antigravity. You said: {message}\n(Note: google-antigravity SDK is not installed on this system.)"
            for char in response_text:
                print(char, end="", flush=True)
                time.sleep(0.01)

if __name__ == "__main__":
    asyncio.run(main())
