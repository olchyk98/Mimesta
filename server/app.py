from flask import Flask
from flask_media import Media
from flask_cors import CORS
from flask_graphql import GraphQLView
from schema import schema
from db_fetch import fetch as fetchDB
from graphene_file_upload.flask import FileUploadGraphQLView

# Create flask application
app = Flask(__name__)
app.secret_key = "RyU=9DL$$PBNdtQ5ZuWg"
CORS(
    app = app,
    supports_credentials = True
)
app.config['MEDIA_SETS'] = 'avatar'
Media(app)

# Create important tables
#     Users
fetchDB("""
    CREATE TABLE IF NOT EXISTS Users (
        id bigserial primary key,
        name text NOT NULL,
        email text NOT NULL,
        password text NOT NULL,
        avatar text NOT NULL
    );
""", False)
    # Desks
fetchDB("""
    CREATE TABLE IF NOT EXISTS Desks (
        id bigserial primary key,
        creatorid bigserial NOT NULL,
        ownersid text[] NOT NULL,
        name text NOT NULL,
        createtime timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
""", False)
    # Cards
fetchDB("""
    CREATE TABLE IF NOT EXISTS Cards (
        id bigserial primary key,
        deskid bigserial NOT NULL,
        creatorid bigserial NOT NULL,
        fronttext text NOT NULL,
        backtext text NOT NULL,
        addtime timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatetime timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        showtimes INTEGER NOT NULL
    );
""", False)
    # DeskGames

'''
    losedCards - repeated cards
    clearCards - cards haven't been repeated
    maxStrike - number of clearCards in row
'''
fetchDB("""
    CREATE TABLE IF NOT EXISTS DeskGames (
        id bigserial primary key,
        seconds int NOT NULL,
        playerid bigserial NOT NULL,
        losedCards int NOT NULL,
        clearCards int NOT NULL,
        playdate timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        maxStrike int NOT NULL,
        deskid bigserial NOT NULL,
        cardsInt int NOT NULL
    )
""", False)

# Serve GraphQL API
app.add_url_rule(
    '/',
    view_func=FileUploadGraphQLView.as_view(
        'graphql',
        graphiql = True,
        schema = schema
    )
)

# Allow to run this function using flask manager
if(__name__ == '__main__'):
    app.run(debug = True, port = 4000) # Run server with live reload.
# end