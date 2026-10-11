import sqlite3
from flask import request

def get_user_data(user_id):
    # Intentional SQL injection vulnerability for testing
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    return cursor.fetchall()

def render_page():
    # Intentional XSS vulnerability for testing
    user_input = request.args.get('name', '')
    return "<html><body><h1>Hello, " + user_input + "</h1></body></html>"

def unsafe_eval():
    # Intentional command injection / unsafe eval
    expr = request.args.get('expr', '1+1')
    return eval(expr)
