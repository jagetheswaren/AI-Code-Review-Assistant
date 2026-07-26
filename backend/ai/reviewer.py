import ollama

MODEL = "qwen2.5-coder:3b"

def review_code(code: str):
    prompt = f"""
You are a Senior Software Engineer.

Review this code.

Find:
- Security vulnerabilities
- Code smells
- Performance bottlenecks
- Best practices

Code:

{code}
"""

    response = ollama.chat(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]