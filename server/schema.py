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
    # -
    cards = GraphQL.List(lambda: CardType)
    resolve_cards = lambda self, info: fetchDB('''SELECT * FROM Cards WHERE (deskid = '%s')''' % (self.id), 'M')
    # -
    cardsInt = GraphQL.Int()
    resolve_cardsInt = lambda self, info: fetchDB('''SELECT COUNT(*) FROM Cards WHERE (deskid = '%s')''' % (self.id), 'S').count
    # -
    ownersInt = GraphQL.Int()
    resolve_ownersInt = lambda self, info: len(self.ownersid)
    # -
    creator = GraphQL.Field(UserType)
    resolve_creator = lambda self, info: fetchDB('''SELECT * FROM Users WHERE id = '%s' ''' % (self.creatorid), 'S')


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
    creator = GraphQL.Field(lambda: UserType)
    resolve_creator = lambda self, info: fetchDB('''SELECT * FROM Users WHERE id = '%s' ''' % (self.creatorid), 'S')
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
    getDesk = GraphQL.Field(DeskType, id = GraphQL.NonNull(GraphQL.ID))
    def resolve_getDesk(self, info, id):
        uid = session.get('userid', None)

        if(uid):
            return fetchDB('''SELECT * FROM Desks WHERE id = '%s' AND '{"%s"}' @> ownersid''' % (id, uid), 'S')
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

    class UpdateDeskNameMutation(GraphQL.Mutation):
        class Arguments:
            name = GraphQL.NonNull(GraphQL.String)
            id = GraphQL.NonNull(GraphQL.ID)
        # end

        Output = DeskType

        def mutate(self, info, id, name):
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            return fetchDB('''UPDATE Desks SET name = '%s' WHERE id = '%s' AND '{"%s"}' @> ownersid RETURNING *''' % (name, uid, id), 'S')
        # end
    # end

    class AddDeskCardMutation(GraphQL.Mutation):
        class Arguments:
            deskID = GraphQL.NonNull(GraphQL.ID)
            front = GraphQL.NonNull(GraphQL.String)
            back = GraphQL.NonNull(GraphQL.String)
        # end

        Output = CardType

        def mutate(self, info, deskID, front, back):
            # Check if user has a session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify this desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = '%s' AND '{"%s"}' @> ownersid''' % (deskID, uid), 'S')):
                return None
            # end
            
            # Update desk
            return fetchDB('''
                INSERT INTO Cards (deskid, creatorid, fronttext, backtext, showtimes) VALUES
                ('%s', '%s', '%s', '%s', %s) RETURNING *
            ''' % (deskID, uid, front, back, 0), 'S')
        # end
    # end

    class UpdateCardContentMutation(GraphQL.Mutation):
        class Arguments:
            id = GraphQL.NonNull(GraphQL.ID)
            deskID = GraphQL.NonNull(GraphQL.ID)
            front = GraphQL.NonNull(GraphQL.String)
            back = GraphQL.NonNull(GraphQL.String)
        # end

        Output = CardType
        
        def mutate(self, info, deskID, front, back, id):
            # Check if user has a session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify the parent desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = '%s' AND '{"%s"}' @> ownersid''' % (deskID, uid), 'S')):
                return None
            # end

            # Update card
            return fetchDB('''UPDATE Cards SET fronttext = '%s', backtext = '%s' WHERE id = '%s' AND deskid = '%s' RETURNING *''' % (front, back, id, deskID), 'S')
        # end
    # end

    registerUser = RegisterUserMutation.Field()
    loginUser = LoginUserMutation.Field()
    createDesk = CreateDeskMutation.Field()
    updateDeskName = UpdateDeskNameMutation.Field()
    addDeskCard = AddDeskCardMutation.Field()
    updateCardContent = UpdateCardContentMutation.Field()
# end

schema = GraphQL.Schema(query = RootQuery, mutation = RootMutation, auto_camelcase = False)