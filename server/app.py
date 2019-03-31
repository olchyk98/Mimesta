import psycopg2

connection = psycopg2.connect(
    host = "balarama.db.elephantsql.com",
    database = "wxfhomqv",
    user = "wxfhomqv",
    password = "DxuMkZklXA7PhuK_wENpzUMuGUHvYjOZ"
)

# cursor = connection.cursor()

# cursor.execute("""""")

# cursor.close()
# connection.commit()

connection.close()