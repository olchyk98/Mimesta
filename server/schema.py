import graphene as GraphQL
from graphql import GraphQLError
from flask import session
from db_fetch import fetch as fetchDB

class UserTypeStatType(GraphQL.ObjectType):
    date = GraphQL.DateTime()
    value = GraphQL.String()
# end

class UserType(GraphQL.ObjectType):
    id = GraphQL.ID()
    name = GraphQL.String()
    email = GraphQL.String()
    password = GraphQL.String()
    avatar = GraphQL.String()
    # -
    desks = GraphQL.List(lambda: DeskType)
    resolve_desks = lambda self, info: fetchDB('''SELECT * FROM Desks WHERE (creatorid = $$%s$$)''' % (self.id), 'M')
    # -
    addedCardsMonth = GraphQL.Int()
    def resolve_addedCardsMonth(self, info):
        return fetchDB('''SELECT COUNT(id) FROM Cards WHERE creatorid = $$%s$$ AND (DATE_PART('month', NOW()) - DATE_PART('month', addtime)) <= 1''' % (self.id), 'S').count or 0
    # end
    playedSecondsMonth = GraphQL.Int()
    def resolve_playedSecondsMonth(self, info):
        return fetchDB('''SELECT SUM(seconds) FROM DeskGames WHERE playerid = $$%s$$ AND (DATE_PART('month', NOW()) - DATE_PART('month', date)) <= 1''' % (self.id), 'S').sum or 0
    # end
    learnedCardsMonth = GraphQL.Int()
    def resolve_learnedCardsMonth(self, info):
        return fetchDB('''SELECT SUM(cardsInt) FROM DeskGames WHERE playerid = $$%s$$ AND (DATE_PART('month', NOW()) - DATE_PART('month', date)) <= 1''' % (self.id), 'S').sum or 0
    # end
    availableCards = GraphQL.List(lambda: CardType, limit = GraphQL.Int())
    def resolve_availableCards(self, info, limit):
        return fetchDB('''SELECT Cards.* FROM Cards, Desks WHERE $${"%s"}$$ @> Desks.ownersid LIMIT %s''' % (self.id, limit), 'M')
    # end
    addedCardsStat = GraphQL.List(lambda: UserTypeStatType)
    def resolve_addedCardsStat(self, info):
        cards = fetchDB('''SELECT id, addtime::timestamp::date FROM Cards WHERE creatorid = $$%s$$''' % (self.id), 'M')

        res = []

        def searchv(value, field): # fin - field index
            for ma in range(len(res)):
                if(res[ma][field] == value):
                    return ma
                    break;
                # end
            # end
            return False
        # end

        for ma in range(len(cards)):
            obj = cards[ma]
            _a = obj.addtime

            ind = searchv(_a, 'date')

            if(ind == False):
                res.append({
                    "date": _a,
                    "value": 1    
                })
            else:
                res[ind]["value"] += 1 # end
        # end

        print(res)

        return None
    # end
    gamesPlayedStat = GraphQL.List(lambda: UserTypeStatType)
    def resolve_gamesPlayedStat(self, info):
        return None
    # end
    createdDesksStat = GraphQL.List(lambda: UserTypeStatType)
    def resolve_createdDesksStat(self, info):
        return None
    # end
# end

class DeskType(GraphQL.ObjectType):
    id = GraphQL.ID()
    creatorid = GraphQL.ID()
    ownersid = GraphQL.List(GraphQL.ID)
    name = GraphQL.String()
    # -
    cards = GraphQL.List(lambda: CardType)
    resolve_cards = lambda self, info: fetchDB('''SELECT * FROM Cards WHERE (deskid = $$%s$$) ORDER BY updatetime DESC''' % (self.id), 'M')
    # -
    cardsInt = GraphQL.Int()
    resolve_cardsInt = lambda self, info: fetchDB('''SELECT COUNT(id) FROM Cards WHERE (deskid = $$%s$$)''' % (self.id), 'S').count or 0
    # -
    ownersInt = GraphQL.Int()
    resolve_ownersInt = lambda self, info: len(self.ownersid)
    # -
    creator = GraphQL.Field(UserType)
    resolve_creator = lambda self, info: fetchDB('''SELECT * FROM Users WHERE id = $$%s$$ ''' % (self.creatorid), 'S')
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
    # -
    creator = GraphQL.Field(lambda: UserType)
    resolve_creator = lambda self, info: fetchDB('''SELECT * FROM Users WHERE id = $$%s$$ ''' % (self.creatorid), 'S')
    # -
    desk = GraphQL.Field(lambda: DeskType)
    resolve_desk = lambda self, info: fetchDB('''SELECT * FROM Desks WHERE id = $$%s$$''' % (self.deskid), 'S')
# end

class DeskGameType(GraphQL.ObjectType):
    id = GraphQL.ID()
    seconds = GraphQL.Int()
    playerid = GraphQL.Int()
    losedCards = GraphQL.Int()
    clearCards = GraphQL.Int()
    date = GraphQL.DateTime()
    maxStrike = GraphQL.Int()
    deskid = GraphQL.ID()
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
    cards = GraphQL.List(CardType)
    def resolve_cards(self, info):
        return fetchDB('''SELECT * FROM Cards''', 'M')
    # end
    # --- DEVELOPMENT ---
    user = GraphQL.Field(UserType)
    def resolve_user(self, info):
        uid = session.get('userid', None)
        if(uid):
            return fetchDB('''SELECT * FROM Users WHERE (id = $$%s$$)''' % (uid), 'S')
        # end
        else:
            return None
        # end
    # end
    getDesk = GraphQL.Field(DeskType, id = GraphQL.NonNull(GraphQL.ID), shuffleLimit = GraphQL.Int())
    def resolve_getDesk(self, info, id, shuffleLimit = 'ALL'):
        uid = session.get('userid', None)

        if(uid):
            return fetchDB('''SELECT * FROM Desks WHERE id = $$%s$$ AND $${"%s"}$$ @> ownersid ORDER BY RANDOM() LIMIT %s''' % (id, uid, shuffleLimit), 'S')
        else:
            return None
        # end
    # end
    searchCards = GraphQL.List(CardType, query = GraphQL.NonNull(GraphQL.String))
    def resolve_searchCards(self, info, query):
        # Check if user has a session
        uid = session.get('userid', None)
        if(not uid): raise GraphQLError("No session")

        return fetchDB('''
            SELECT Cards.* FROM Cards, Desks WHERE $${"%s"}$$ @> Desks.ownersid
            AND (fronttext LIKE $$%%%s%%$$ OR backtext LIKE $$%%%s%%$$)
        ''' % (uid, query, query), 'M')
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
            iu = fetchDB('''SELECT id FROM Users WHERE (email = $$%s$$)''' % (email), 'S')
            if(iu): return None

            # Create user
            defavatar = '/default/avatar.jpeg'
            
            user = fetchDB('''INSERT INTO Users (name, email, password, avatar) VALUES ($$%s$$, $$%s$$, $$%s$$, $$%s$$) RETURNING *''' % (name, email, password, defavatar), 'S')
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
            user = fetchDB('''SELECT * FROM Users WHERE (email = $$%s$$ AND password = $$%s$$)''' % (email, password), 'S')
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
                
                return fetchDB('''INSERT INTO Desks (creatorid, ownersid, name) VALUES ($$%s$$, $${"%s"}$$, $$%s$$) RETURNING *''' % (uid, uid, defname), 'S')
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

            return fetchDB('''UPDATE Desks SET name = $$%s$$ WHERE id = $$%s$$ AND $${"%s"}$$ @> ownersid RETURNING *''' % (name, uid, id), 'S')
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
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $${"%s"}$$ @> ownersid''' % (deskID, uid), 'S')):
                return None
            # end
            
            # Update desk
            return fetchDB('''
                INSERT INTO Cards (deskid, creatorid, fronttext, backtext, showtimes) VALUES
                ($$%s$$, $$%s$$, $$%s$$, $$%s$$, %s) RETURNING *
            ''' % (deskID, uid, front, back, 0), 'S')
        # end
    # end

    class UpdateCardContentMutation(GraphQL.Mutation):
        class Arguments:
            id = GraphQL.NonNull(GraphQL.ID)
            deskID = GraphQL.NonNull(GraphQL.ID)
            front = GraphQL.String(required = False)
            back = GraphQL.String(required = False)
        # end

        Output = CardType
        
        def mutate(self, info, deskID, front, back, id):
            # Check if user has a session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify the parent desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $${"%s"}$$ @> ownersid''' % (deskID, uid), 'S')):
                return None
            # end

            # Update card
            if(front): front = '$$%s$$' % (front)
            else: front = 'Cards.fronttext'
            if(back): back = '$$%s$$' % (back)
            else: back = 'Cards.backtext'

            return fetchDB('''UPDATE Cards SET fronttext = %s, backtext = %s, updatetime = NOW() WHERE id = $$%s$$ AND deskid = $$%s$$ RETURNING *''' % (front, back, id, deskID), 'S')
        # end
    # end

    class DeleteCardMutation(GraphQL.Mutation):
        class Arguments:
            id = GraphQL.NonNull(GraphQL.ID)
            deskID = GraphQL.NonNull(GraphQL.ID)
        # end

        Output = CardType

        def mutate(self, info, id, deskID):
            # Check if user has a session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify the parent desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $${"%s"}$$ @> ownersid''' % (deskID, uid), 'S')):
                return None
            # end

            # Delete card
            return fetchDB('''DELETE FROM Cards WHERE id = $$%s$$ AND deskid = $$%s$$ RETURNING *''' % (id, deskID), 'S')
        # end
    # end

    class DeleteDeskMutation(GraphQL.Mutation):
        class Arguments:
            id = GraphQL.NonNull(GraphQL.ID)
        # end

        Output = DeskType

        def mutate(self, info, id):
            # Check if user has a session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Delete all linked cards
            fetchDB('''DELETE FROM Cards WHERE deskid = $$%s$$''' % (id), False)

            # Delete desk
            return fetchDB('''DELETE FROM Desks WHERE id = $$%s$$ AND creatorid = $$%s$$ RETURNING *''' % (id, uid), 'S')
        # end
    # end

    class PlayDeskMutation(GraphQL.Mutation):
        class Arguments:
            deskID = GraphQL.NonNull(GraphQL.ID)
            seconds = GraphQL.NonNull(GraphQL.Int)
            losedCards = GraphQL.NonNull(GraphQL.Int)
            clearCards = GraphQL.NonNull(GraphQL.Int)
            maxStrike = GraphQL.NonNull(GraphQL.Int)
            cardsID = GraphQL.List(GraphQL.ID, required = True)
        # end

        Output = DeskGameType

        def mutate(self, info, deskID, seconds, losedCards, clearCards, maxStrike, cardsID):
            # Check if user has a session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user is a member of this desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $${"%s"}$$ @> ownersid''' % (deskID, uid), 'S')):
                return None
            # end

            # Check if desk exists
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$''' % (deskID), 'S')):
                return None
            # end

            # Update played cards
            fetchDB('''UPDATE Cards SET showtimes = showtimes + 1 WHERE id IN %s''' % (str(tuple(cardsID))))

            # Create a game session
            return fetchDB('''
                INSERT INTO DeskGames (cardsInt, deskid, seconds, playerid, losedCards, clearCards, maxStrike) VALUES (
                    %s, $$%s$$, %s, $$%s$$, %s, %s, %s
                ) RETURNING *
            ''' % (len(cardsID), deskID, seconds, uid, losedCards, clearCards, maxStrike), 'S')
        # end
    # end

    registerUser = RegisterUserMutation.Field()
    loginUser = LoginUserMutation.Field()
    createDesk = CreateDeskMutation.Field()
    updateDeskName = UpdateDeskNameMutation.Field()
    addDeskCard = AddDeskCardMutation.Field()
    updateCardContent = UpdateCardContentMutation.Field()
    deleteCard = DeleteCardMutation.Field()
    deleteDesk = DeleteDeskMutation.Field()
    playDesk = PlayDeskMutation.Field()
# end

schema = GraphQL.Schema(query = RootQuery, mutation = RootMutation, auto_camelcase = False)