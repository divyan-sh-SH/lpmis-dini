import os
import anthropic
from dotenv import load_dotenv
load_dotenv()

def chat_completion(messages: list[dict]) -> str:
    """
    Send a message to Claude and get a response.
    
    Args:
        messages: List of message dicts with 'role' and 'content' keys
        
    Returns:
        Response text from Claude
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    client = anthropic.Anthropic(api_key=api_key)
    
    response = client.messages.create(
        model="claude-opus-",
        max_tokens=1024,
        messages=messages,
    )
    
    return response.content[0].text

if __name__ == "__main__":
    messages = [
        {"role": "user", "content": "What is the capital of France?"}
    ]
    response = chat_completion(messages)
    print(response)