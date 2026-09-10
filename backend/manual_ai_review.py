from ai.reviewer import review_code


def main():
    code = """
    password = "123456"

    print(password)
    """

    result = review_code(code)
    print(result)


if __name__ == "__main__":
    main()
