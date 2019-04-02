from flask import Flask
from flask_graphql import GraphQLView
from schema import schema
from db_fetch import fetch as fetchDB

# Create flask application
app = Flask(__name__)
app.secret_key = "pass"

# Create important tables
    # Users
fetchDB("""
    CREATE TABLE IF NOT EXISTS Users (
        id bigserial primary key,
        name text NOT NULL,
        login text NOT NULL,
        password text NOT NULL,
        avatar text NOT NULL
    );
""", False)
    # Cards
fetchDB("""
    CREATE TABLE IF NOT EXISTS Desks (
        id bigserial primary key,
        creatorid bigserial NOT NULL,
        ownersid text[] NOT NULL
    );
""", False)

# Serve GraphQL API
app.add_url_rule('/', view_func = GraphQLView.as_view(
    'graphql',
    graphiql = True,
    schema = schema
)) 

# Allow to run this function using the flask manager
if(__name__ == '__main__'):
    app.run(debug = True, port = 4000) # Run server with live reload.
# end