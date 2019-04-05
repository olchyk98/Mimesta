import psycopg2
import psycopg2.extras

# Connect to the database
connection = psycopg2.connect(
    host = "balarama.db.elephantsql.com",
    database = "wxfhomqv",
    user = "wxfhomqv",
    password = "DxuMkZklXA7PhuK_wENpzUMuGUHvYjOZ"
)

def fetch(query, tillOutput = False):
    cursor = connection.cursor(cursor_factory = psycopg2.extras.NamedTupleCursor)
    
    cursor.execute(query)
    result = None

    if(tillOutput == 'M'): # return rows
        a = cursor.fetchall()
        result = a
    elif(tillOutput == 'S'):
        a = cursor.fetchone()
        result = a
    # end

    cursor.close()
    connection.commit()
    return result
# end