import graphene as GraphQL
from graphql import GraphQLError
from flask import session
from db_fetch import fetch as fetchDB

class UserType(GraphQL.ObjectType):
    id = GraphQL.ID()
    name = GraphQL.String()
    login = GraphQL.String()
    password = GraphQL.String()
    avatar = GraphQL.String()
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
    class registerUserMutation(GraphQL.Mutation):
        class Arguments:
            name = GraphQL.NonNull(GraphQL.String)
            login = GraphQL.NonNull(GraphQL.String)
            password = GraphQL.NonNull(GraphQL.String)
        # end

        Output = UserType

        def mutate(self, info, name, login, password):
            # Create user
            result = fetchDB('''INSERT INTO Users (name, login, password, avatar) VALUES ('%s', '%s', '%s', 'nothing') RETURNING *''' % (name, login, password), 'S')
            print(result)

            # Return user
            return result
        # end
    # end

    class createDeskMutation(GraphQL.Mutation):
        Output = GraphQL.String

        def mutate(self, info):
            fetchDB('''INSERT INTO Desks (creatorid, ownersid) VALUES ('1', '{"1"}')''', False)

            return "oles"
        # end
    # end

    registerUser = registerUserMutation.Field()
    loginUser = registerUserMutation.Field()
    createDesk = createDeskMutation.Field()
# end

schema = GraphQL.Schema(query = RootQuery, mutation = RootMutation)