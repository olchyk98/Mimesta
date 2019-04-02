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

    if(tillOutput == 'M'): # return rows
        results = cursor.fetchall()
        return results
    elif(tillOutput == 'S'):
        result = cursor.fetchone()
        return result
    else:
        cursor.close()
        connection.commit()

        return None
    # end
# end