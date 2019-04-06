import graphene as GraphQL
from graphql import GraphQLError
from flask import session
from db_fetch import fetch as fetchDB

class UserType(GraphQL.ObjectType):
    id = GraphQL.ID()
    name = GraphQL.String()
    email = GraphQL.String()
    password = GraphQL.String()
    avatar = GraphQL.String()
    #-
    desks = GraphQL.List(lambda: DeskType)
    resolve_desks = lambda self, info: fetchDB('''SELECT * FROM Desks WHERE (creatorid = '%s')''' % (self.id), 'M')
    #-
# end

class DeskType(GraphQL.ObjectType):
    id = GraphQL.ID()
    creatorid = GraphQL.ID()
    ownersid = GraphQL.List(GraphQL.ID)
    name = GraphQL.String()
    #-
    cards = GraphQL.List(lambda: CardType)
    resolve_cards = lambda self, info: fetchDB('''SELECT * FROM Cards WHERE (deskid = '%s')''' % (self.id), 'M')
    #-
    cardsInt = GraphQL.Int()
    resolve_cardsInt = lambda self, info: fetchDB('''SELECT COUNT(*) FROM Cards WHERE (deskid = '%s')''' % (self.id), 'S').count
# end

class CardType(GraphQL.ObjectType):
    id = GraphQL.ID()
    deskid = GraphQL.ID()
    creatorid = GraphQL.ID()
    fronttext = GraphQL.String()
    backtext = GraphQL.String()
    addtime = GraphQL.DateTime()
    updatetime = GraphQL.DateTime()
    showtimes = GraphQL.Int()
# end

class RootQuery(GraphQL.ObjectType):
    # --- DEVELOPMENT ---
    desks = GraphQL.List(DeskType)
    def resolve_desks(self, info):
        return fetchDB('''SELECT * FROM Desks''', 'M')
    # end
    users = GraphQL.List(UserType)
    def resolve_users(self, info):
        return fetchDB('''SELECT * FROM Users''', 'M')
    # end
    # --- DEVELOPMENT ---
    user = GraphQL.Field(UserType)
    def resolve_user(self, info):
        uid = session.get('userid', None)
        if(uid):
            return fetchDB('''SELECT * FROM Users WHERE (id = '%s')''' % (uid), 'S')
        # end
        else:
            return None
        # end
    # end
# end

class RootMutation(GraphQL.ObjectType):
    class RegisterUserMutation(GraphQL.Mutation):
        class Arguments:
            name = GraphQL.NonNull(GraphQL.String)
            email = GraphQL.NonNull(GraphQL.String)
            password = GraphQL.NonNull(GraphQL.String)
        # end

        Output = UserType

        def mutate(self, info, name, email, password):
            # Check if user with that email already exists
            iu = fetchDB('''SELECT id FROM Users WHERE (email = '%s')''' % (email), 'S')
            if(iu): return None

            # Create user
            defavatar = '/default/avatar.jpeg'
            
            user = fetchDB('''INSERT INTO Users (name, email, password, avatar) VALUES ('%s', '%s', '%s', '%s') RETURNING *''' % (name, email, password, defavatar), 'S')
            session['userid'] = user.id

            # Return user
            return user
        # end
    # end

    class LoginUserMutation(GraphQL.Mutation):
        class Arguments:
            email = GraphQL.NonNull(GraphQL.String)
            password = GraphQL.NonNull(GraphQL.String)
        # end

        Output = UserType

        def mutate(self, info, email, password):
            user = fetchDB('''SELECT * FROM Users WHERE (email = '%s' AND password = '%s')''' % (email, password), 'S')
            if(user):
                session['userid'] = user.id
                return user
            else: # invalid data
                return None
            # end
        # end
    # end

    class CreateDeskMutation(GraphQL.Mutation):
        Output = DeskType

        def mutate(self, info):
            uid = session.get('userid', None)
            
            if(uid):
                defname = 'Untitled desk'
                
                return fetchDB('''INSERT INTO Desks (creatorid, ownersid, name) VALUES ('%s', '{"%s"}', '%s') RETURNING *''' % (uid, uid, defname), 'S')
            else:
                raise GraphQLError("No session")
            # end
        # end
    # end

    registerUser = RegisterUserMutation.Field()
    loginUser = LoginUserMutation.Field()
    createDesk = CreateDeskMutation.Field()
# end

schema = GraphQL.Schema(query = RootQuery, mutation = RootMutation)