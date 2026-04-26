import os
import anthropic
from dotenv import load_dotenv
load_dotenv()


def chat_completion(messages: list[dict], system: str = "") -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key)

    kwargs: dict = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 1024,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system

    response = client.messages.create(**kwargs)
    return response.content[0].text


if __name__ == "__main__":
    messages = [{"role": "user", "content": "What is the capital of France?"}]
    print(chat_completion(messages))
