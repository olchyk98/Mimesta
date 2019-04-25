import graphene as GraphQL
from graphene.types.resolver import dict_resolver
from graphql import GraphQLError
from flask import session
from graphene_file_upload.scalars import Upload as GraphQLUpload
from db_fetch import fetch as fetchDB

import re
import string
import imageio
import random

# 123
class UserTypeStatType(GraphQL.ObjectType):
    class Meta:
        default_resolver = dict_resolver
    # end

    date = GraphQL.DateTime()
    value = GraphQL.String()
# end

def countByField(arr, field):
    res = []

    def searchv(value, field): # fin - field index
        for ma in range(len(res)):
            if(res[ma][field] == value):
                return ma
                break
            # end
        # end
        return False
    # end

    for ma in range(len(arr)):
        _a = getattr(arr[ma], field)
        ind = searchv(_a, 'date')

        if(ind is False):
            res.append({
                "date": _a,
                "value": 1    
            })
        else:
            res[ind]["value"] += 1
        # end
    # end

    return res
# end
# 123

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
    availableDesks = GraphQL.List(lambda: DeskType)
    resolve_availableDesks = lambda self, info: fetchDB('''SELECT * FROM Desks WHERE $$%s$$ = ANY(ownersid::int[])''' % (self.id), 'M')
    # -
    addedCardsMonth = GraphQL.Int()
    def resolve_addedCardsMonth(self, info):
        return fetchDB('''SELECT COUNT(id) FROM Cards WHERE creatorid = $$%s$$ AND (DATE_PART('month', NOW()) - DATE_PART('month', addtime)) <= 1''' % (self.id), 'S').count or 0
    # end
    playedSecondsMonth = GraphQL.Int()
    def resolve_playedSecondsMonth(self, info):
        return fetchDB('''SELECT SUM(seconds) FROM DeskGames WHERE playerid = $$%s$$ AND (DATE_PART('month', NOW()) - DATE_PART('month', playdate)) <= 1''' % (self.id), 'S').sum or 0
    # end
    learnedCardsMonth = GraphQL.Int()
    def resolve_learnedCardsMonth(self, info):
        return fetchDB('''SELECT SUM(cardsInt) FROM DeskGames WHERE playerid = $$%s$$ AND (DATE_PART('month', NOW()) - DATE_PART('month', playdate)) <= 1''' % (self.id), 'S').sum or 0
    # end
    availableCards = GraphQL.List(lambda: CardType, limit = GraphQL.Int())
    def resolve_availableCards(self, info, limit):
        return fetchDB('''SELECT Cards.* FROM Cards, Desks WHERE Cards.deskid = Desks.id AND $$%s$$ = ANY(Desks.ownersid::int[]) LIMIT %s''' % (self.id, limit), 'M')
    # end
    addedCardsStat = GraphQL.List(lambda: UserTypeStatType)
    def resolve_addedCardsStat(self, info):
        cards = fetchDB('''SELECT id, addtime::timestamp::date FROM Cards WHERE creatorid = $$%s$$''' % (self.id), 'M')
        return countByField(cards, 'addtime')
    # end
    gamesPlayedStat = GraphQL.List(lambda: UserTypeStatType)
    def resolve_gamesPlayedStat(self, info):
        cards = fetchDB('''SELECT id, playdate::timestamp::date FROM DeskGames WHERE playerid = $$%s$$''' % (self.id), 'M')
        return countByField(cards, 'playdate')
    # end
    createdDesksStat = GraphQL.List(lambda: UserTypeStatType)
    def resolve_createdDesksStat(self, info):
        cards = fetchDB('''SELECT id, createtime::timestamp::date FROM Desks WHERE creatorid = $$%s$$''' % (self.id), 'M')
        return countByField(cards, 'createtime')
    # end
    # playedMinutesStat #-?
# end

class DeskType(GraphQL.ObjectType):
    id = GraphQL.ID()
    creatorid = GraphQL.ID()
    ownersid = GraphQL.List(GraphQL.ID)
    name = GraphQL.String()
    # -
    cards = GraphQL.List(lambda: CardType, shuffleLimit = GraphQL.Int())
    resolve_cards = lambda self, info, shuffleLimit = 'ALL': fetchDB('''SELECT * FROM Cards WHERE (deskid = $$%s$$) ORDER BY RANDOM() LIMIT %s''' % (self.id, shuffleLimit), 'M')
    # -
    cardsInt = GraphQL.Int()
    resolve_cardsInt = lambda self, info: fetchDB('''SELECT COUNT(id) FROM Cards WHERE (deskid = $$%s$$)''' % (self.id), 'S').count or 0
    # -
    ownersInt = GraphQL.Int()
    resolve_ownersInt = lambda self, info: len(self.ownersid)
    # -
    owners = GraphQL.List(lambda: UserType, search = GraphQL.String())
    resolve_owners = lambda self, info, search = None: fetchDB('''SELECT * FROM Users WHERE id IN (%s)%s''' % (','.join(self.ownersid), (search and ' AND (name LIKE $$%%%s%%$$ OR email LIKE $$%%%s%%$$)' % (search, search)) or ''), 'M')
    # -
    creator = GraphQL.Field(UserType)
    resolve_creator = lambda self, info: fetchDB('''SELECT * FROM Users WHERE id = $$%s$$ ''' % (self.creatorid), 'S')
    # -
    playedTimes = GraphQL.Int()
    resolve_playedTimes = lambda self, info: fetchDB('''SELECT COUNT(id) FROM DeskGames WHERE deskid = $$%s$$''' % self.id, 'S').count
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
    getDesk = GraphQL.Field(DeskType, id = GraphQL.NonNull(GraphQL.ID))
    def resolve_getDesk(self, info, id):
        uid = session.get('userid', None)

        if(uid):
            return fetchDB('''SELECT * FROM Desks WHERE id = $$%s$$ AND $$%s$$ = ANY(ownersid::int[])''' % (id, uid), 'S')
        else:
            return None
        # end
    # end
    searchCards = GraphQL.List(CardType, query = GraphQL.NonNull(GraphQL.String))
    def resolve_searchCards(self, info, query):
        # Check if user has an active session
        uid = session.get('userid', None)
        if(not uid): raise GraphQLError("No session")

        return fetchDB('''
            SELECT Cards.* FROM Cards, Desks WHERE $$%s$$ = ANY(Desks.ownersid::int[])
            AND (fronttext LIKE $$%%%s%%$$ OR backtext LIKE $$%%%s%%$$)
        ''' % (uid, query, query), 'M')
    # end
    searchPeople = GraphQL.List(UserType, query = GraphQL.NonNull(GraphQL.String), exceptDeskID = GraphQL.ID())
    def resolve_searchPeople(self, info, query, exceptDeskID):
        # Check if user has an active session
        uid = session.get('userid', None)
        if(not uid): raise GraphQLError("No session")

        # return users
        if(not exceptDeskID):
            return fetchDB('''SELECT * FROM Users WHERE name LIKE $$%%%s%%$$ OR email LIKE $$%%%s%%$$''' % (query, query), 'M')
        else:
            return fetchDB('''SELECT Users.* FROM Users, Desks WHERE Desks.id = $$%s$$ AND Users.id != ANY(Desks.ownersid::int[]) AND (Users.name LIKE $$%%%s%%$$ OR Users.email LIKE $$%%%s%%$$)''' % (exceptDeskID, query, query), 'M')
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

            return fetchDB('''UPDATE Desks SET name = $$%s$$ WHERE id = $$%s$$ AND $$%s$$ = ANY(ownersid::int[]) RETURNING *''' % (name, uid, id), 'S')
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
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify this desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $$%s$$ = ANY(ownersid::int[])''' % (deskID, uid), 'S')):
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
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify the parent desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $$%s$$ = ANY(ownersid::int[])''' % (deskID, uid), 'S')):
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
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user has a permission to modify the parent desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $$%s$$ = ANY(ownersid::int[])''' % (deskID, uid), 'S')):
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
            # Check if user has an active session
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
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # Check if user is a member of this desk
            if(not fetchDB('''SELECT id FROM Desks WHERE id = $$%s$$ AND $$%s$$ = ANY(ownersid::int[])''' % (deskID, uid), 'S')):
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

    class ChangeProfileSettingsMutation(GraphQL.Mutation):
        class Arguments:
            avatar = GraphQLUpload()
            name = GraphQL.String()
            email = GraphQL.String()
            oldPassword = GraphQL.String()
            password = GraphQL.String()
        # end

        Output = UserType

        # XXX
        def mutate(self, info, avatar = None, name = None, email = None, oldPassword = None, password = None):
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            inres = ""

            avatarPath = None
            if(avatar): # receive avatar
                def gen(length = 135):
                    lib = string.ascii_letters + string.digits
                    e = ""

                    for ma in range(length):
                        e += lib[random.randrange(len(lib))]

                    return e
                # end

                ext = re.findall(r'[^\\]*\.(\w+)$', avatar.filename)[0]

                avatarPath = '/avatars/%s.%s' % (gen(), ext)
                avatar.save('./static/ud' + avatarPath)
            # end

            fields = [
                { "field": "name", "value": name },
                { "field": "email", "value": email },
                { "field": "avatar", "value": avatarPath },
            ]
            if(oldPassword and password): fields.append({ "field": "password", "value": password })

            for ma in fields:
                if(inres): inres += ', '
                inres += '%s = ' % ma['field']
                if(ma['value']): inres += "$$%s$$" % ma['value']
                else: inres += ma['field']
            # end

            if(not inres): return None

            return fetchDB('''
                UPDATE Users SET %s WHERE id = $$%s$$%s RETURNING *
            ''' % (inres, uid, (oldPassword and password and ' AND password = $$%s$$' % oldPassword) or ''), 'S')
        # end
    # end

    class AddUserToDeskMutation(GraphQL.Mutation):
        class Arguments:
            deskID = GraphQL.NonNull(GraphQL.ID)
            targetID = GraphQL.NonNull(GraphQL.ID)
        # end

        Output = UserType

        def mutate(self, info, deskID, targetID):
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # ...
            fetchDB('''UPDATE Desks SET ownersid = array_cat(ownersid, $${"%s"}$$) WHERE id = %s RETURNING *''' % (targetID, deskID), 'S')

            # Return added user
            return fetchDB('''SELECT * FROM Users WHERE id = %s''' % targetID, 'S')
        # end
    # end

    class RemoveUserFromDeskMutation(GraphQL.Mutation):
        class Arguments:
            deskID = GraphQL.NonNull(GraphQL.ID)
            targetID = GraphQL.NonNull(GraphQL.ID)
        # end

        Output = DeskType

        def mutate(self, info, deskID, targetID):
            # Check if user has an active session
            uid = session.get('userid', None)
            if(not uid): raise GraphQLError("No session")

            # ...
            return fetchDB('''UPDATE Desks SET ownersid = array_remove(ownersid, '%s') WHERE id = %s RETURNING *''' % (targetID, deskID), 'S')
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
    changeProfileSettings = ChangeProfileSettingsMutation.Field()
    addUserToDesk = AddUserToDeskMutation.Field()
    removeUserFromDesk = RemoveUserFromDeskMutation.Field()
# end

schema = GraphQL.Schema(query = RootQuery, mutation = RootMutation, auto_camelcase = False)
