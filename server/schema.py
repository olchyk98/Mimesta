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
    desks = GraphQL.List(lambda: DeskType)
    def resolve_desks(self, info):
        return fetchDB('''SELECT * FROM Desks WHERE (creatorid = '%s')''' % (self.id))
    # end
# end

class DeskType(GraphQL.ObjectType):
    id = GraphQL.ID()
    creatorid = GraphQL.ID()
    ownersid = GraphQL.List(GraphQL.ID)
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
            print(iu)
            if(iu): return None

            # Create user
            user = fetchDB('''INSERT INTO Users (name, email, password, avatar) VALUES ('%s', '%s', '%s', 'nothing') RETURNING *''' % (name, email, password), 'S')
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
        class Arguments:
            name = GraphQL.NonNull(GraphQL.String)
        # end

        Output = DeskType

        def mutate(self, info, name):
            uid = session.get('userid', None)
            
            if(uid):
                return fetchDB('''INSERT INTO Desks (creatorid, ownersid) VALUES ('%s', '{"%s"}') RETURNING *''' % (uid, uid), 'S')
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