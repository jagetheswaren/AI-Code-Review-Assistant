from ai.reviewer import review_code

code = """
password = "123456"

print(password)
"""

result = review_code(code)

print(result)