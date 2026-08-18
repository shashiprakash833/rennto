import sqlite3

def print_schema():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='HAC_expense'")
    row = cursor.fetchone()
    if row:
        pass
    else:
        pass
    conn.close()

if __name__ == "__main__":
    print_schema()
