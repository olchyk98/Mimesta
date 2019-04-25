import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faPlus,
    faPen,
    faCheck, 
    faSyncAlt,
    faTrash,
    faBurn,
    faSkullCrossbones,
    faBomb,
    faSearch,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

import client from '../../apollo';
import links from '../../links';
import { cookieControl, constructClassName, convertTime } from '../../utils';
import api from '../../api';

import { gql } from 'apollo-boost';
import { connect } from 'react-redux';

import LoadIcon from '../__forall__/loadicon';

class Cover extends PureComponent {
    render() {
        return(
            <section className="rn-desk-cover">
                <input
                    className="rn-desk-cover-title definp"
                    maxLength="30"
                    defaultValue={ this.props.deskName }
                    onChange={({ target }) => {
                        clearTimeout(target.submitINT);
                        
                        target.submitINT = setTimeout(() => {
                            const a = a => a && a.replace(/\s|\n/g, "").length;
                            let b = target.value;

                            if(!a(b)) b = "Untitled desk";

                            this.props.updateName(b);
                        }, 250);
                    }}
                />
                <div className="rn-desk-cover-info">
                    <span>{ this.props.cards } cards</span>
                    <span>•</span>
                    <span>played { this.props.playedt } time{ (this.props.playedt !== 1) ? "s" : "" }</span>
                    <span>•</span>
                    <span className="tomodal" onClick={ this.props.requestMembers }>{ this.props.members } member{ (this.props.members !== 1) ? "s" : "" }</span>
                    <span>•</span>
                    <span>created by { this.props.creatorName }</span>
                </div>
                <div className="rn-desk-cover-circle o" />
                <div className="rn-desk-cover-circle s" />
                <div className="rn-desk-cover-circle t" />
            </section>
        );
    }
}

class Cards extends PureComponent {
    render() {
        return(
            <section
                onFocus={ this.props.onFocus }
                className="rn-desk-cards definp"
                tabIndex="-1">
                <table className="rn-desk-cards-mat">
                    <tbody>
                        <tr>
                            <th>Front side</th>
                            <th>Back side</th>
                            <th>Added</th>
                            <th>Last update</th>
                            <th>Played times</th>
                            <th>Created by</th>
                        </tr>
                        {
                            this.props.cards.map(({ id, fronttext, backtext, updatetime, showtimes, addtime, creator: { name: crname } }) => (
                                <tr
                                    key={ id }
                                    className={ (this.props.selectedCard !== id) ? "" : "selected" }
                                    onClick={ () => this.props.selectCard(id) }>
                                    <td>{ fronttext }</td>
                                    <td>{ backtext }</td>
                                    <td>{ convertTime(addtime, 1) }</td>
                                    <td>{ (updatetime !== addtime) ? convertTime(updatetime, 1) : "wasn't updated yet" }</td>
                                    <td>{ showtimes }</td>
                                    <td>{ crname }</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </section>
        );
    }
}

class AddCardModal extends Component {
    constructor(props) {
        super(props);

        this.initialState = {
            cardRotated: false,
            canSubmit: false
        }

        this.state = this.initialState;

        this.sidesRef = {
            front: React.createRef(),
            back: React.createRef()
        }
    }

    componentDidUpdate(pprops) {
        { // Check if card can be submitted
            const _a = this.sidesRef.front.textContent,
                  _b = this.sidesRef.back.textContent;

            const a = (
                _a && _b.replace(/\s|\n/g).length &&
                _a && _b.replace(/\s|\n/g).length
            );

            if(this.state.canSubmit !== a) this.setState({ canSubmit: a });
        }

        // Reset state when modal is activating
        if(!pprops.activeStatus && this.props.activeStatus) {
            this.reset();

            if(this.props.activeStatus === "MODIFY") {
                const { front, back } = this.props.cardModifyData;
                this.setCustomContent({ front, back });
            }
        }
    }

    reset = () => {
        this.setState(this.initialState);
        for(let ma of Object.values(this.sidesRef)) ma.textContent = "";
    }

    setCustomContent = ({ front, back }) => {
        this.sidesRef.front.textContent = front;
        this.sidesRef.back.textContent = back;
    }

    render() {
        return(
            <>
                <div onClick={ () => { this.props.onClose(); } } className={constructClassName({
                    "rn-desk-addcardmod_bg": true,
                    "active": this.props.activeStatus
                })} />
                <div className="rn-desk-addcardmod">
                    <div className="rn-desk-addcardmod-controls">
                        <button
                            className="rn-desk-addcardmod-controls-item definp"
                            onClick={ () => this.setState(({ cardRotated: a }) => ({ cardRotated: !a })) }>
                            <FontAwesomeIcon icon={ faSyncAlt } />
                        </button>
                        <button
                            className="rn-desk-addcardmod-controls-item definp"
                            disabled={ !this.state.canSubmit }
                            onClick={(this.state.canSubmit) ? (() => {
                                this.props.submitCard({
                                    front: this.sidesRef.front.textContent,
                                    back: this.sidesRef.back.textContent
                                });
                                this.props.onClose();
                            }) : null}>
                            <FontAwesomeIcon icon={ faCheck } />
                        </button>
                    </div>
                    <div className={constructClassName({
                        "rn-desk-addcardmod-card": true,
                        "rotated": this.state.cardRotated
                    })}>
                        <div className="rn-desk-addcardmod-card-side front">
                            <h1
                                suppressContentEditableWarning={ true }
                                contentEditable={ true }
                                placeholder="Start typing..."
                                onInput={ () => this.forceUpdate() }
                                className="definp rn-desk-addcardmod-card-target"
                                ref={ ref => this.sidesRef.front = ref }
                            >{""}</h1>
                        </div>
                        <div className="rn-desk-addcardmod-card-side back">
                            <h1
                                suppressContentEditableWarning={ true }
                                contentEditable={ true }
                                placeholder="Start typing..."
                                onInput={ () => this.forceUpdate() } // we need it to check all fields are filledw (componentDidUpdate)
                                className="definp rn-desk-addcardmod-card-target"
                                ref={ ref => this.sidesRef.back = ref }
                            >{""}</h1>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

class MembersModalItem extends PureComponent {
    render() {
        return(
            <div onClick={ this.props.onClick || (() => null) } className={constructClassName({
                "rn-desk-membersmod-plist-item": true,
                "const": this.props.isAddon
            })}>
                {
                    (this.props.isAddon) ? (
                        <>
                            <div className={ `rn-desk-membersmod-plist-item-icinc icon ${ this.props.addonStyle }` }>
                                <FontAwesomeIcon icon={ this.props.addonIcon } />
                            </div>
                            <span>{ this.props.addonText }</span>
                        </>
                    ) : (
                        <>
                            <div className="rn-desk-membersmod-plist-info">
                                <div className="rn-desk-membersmod-plist-item-icinc">
                                    <img alt="user" src={ api.storage + this.props.avatar } />
                                </div>
                                <span>{ this.props.name }</span>
                            </div>
                            {
                                (!this.props.canDelete && !this.props.canAdd) ? null : (
                                    <div onClick={ (this.props.canDelete) ? this.props.onDelete : (this.props.canAdd) ? this.props.onAdd : null } className={constructClassName({
                                        "rn-desk-membersmod-plist-btn": true,
                                        "remove": this.props.canDelete,
                                        "add": this.props.canAdd
                                    })}>
                                        <FontAwesomeIcon icon={ (this.props.canDelete) ? faTrash : faPlus } />
                                    </div>
                                )
                            }
                        </>
                    )
                }
            </div>
        );
    }
}

class MembersModal extends Component { // Infinite scroll
    constructor(props) {
        super(props);

        this.state = {
            members: null,
            membersQ: null, // found members
            searchMode: "LOCAL", // LOCAL (contributors), GLOBAL (people)
            isSearching: false
        }

        this.searchMatRef = React.createRef();

        this.clientID = JSON.parse(cookieControl.get("userdata")).id;
        this.userFields = `
            name,
            avatar
        `;
    }

    componentDidUpdate(pr) {
        if(!pr.visible && this.props.visible && !this.state.members) {
            this.setSearchMode("LOCAL");
            this.loadMembers();
        }
    }

    setSearchMode = (m) => this.setState(() => ({ searchMode: m, membersQ: null }), () => this.searchMatRef.value = "");

    loadMembers = () => {
        if(!this.props.deskid) return this.props.onClose();

        const castError = (err) => {
            if(err) console.error(err);
            this.props.castInfo({
                iconStyle: "error",
                icon: faBomb,
                text: "Ooh. Something went wrong. Please, try again.",
                buttons: [
                    {
                        text: "Continue",
                        onClick: () => null // modal closes automatically
                    }
                ]
            })
        }

        client.query({
            query: gql`
                query($id: ID!) {
                    getDesk(id: $id) {
                        id,
                        owners {
                            id,
                            ${ this.userFields }
                        }
                    }
                }
            `,
            variables: {
                id: this.props.deskid
            }
        }).then(({ data: { getDesk: a } }) => {
            if(!a) return castError();

            this.setState(() => ({
                members: a.owners
            }));
        }).catch(castError);
    }

    searchPeople = query => {
        const setStatus = (s) => this.setState({ isSearching: s });

        switch(this.state.searchMode) {
            case 'LOCAL':
                setStatus(true);

                client.query({
                    query: gql`
                        query($id: ID!, $query: String!) {
                            getDesk(id: $id) {
                                id,
                                owners(search: $query) {
                                    id,
                                    ${ this.userFields }
                                }
                            }
                        }
                    `,
                    variables: {
                        id: this.props.deskid,
                        query
                    }
                }).then(({ data: { getDesk: a } }) => {
                    setStatus(false);
                    if(!a) return;

                    this.setState(() => ({
                        membersQ: a.owners
                    }));
                }).catch((err) => {
                    console.error(err);
                    setStatus(false);
                });
            break;
            case 'GLOBAL':
                setStatus(true);

                client.query({
                    query: gql`
                        query($query: String!, $deskID: ID!) {
                            searchPeople(query: $query, exceptDeskID: $deskID) {
                                id,
                                ${ this.userFields }
                            }
                        }
                    `,
                    variables: {
                        query,
                        deskID: this.props.deskid
                    }
                }).then(({ data: { searchPeople: a } }) => {
                    setStatus(false);
                    if(!a) return;

                    this.setState(() => ({
                        membersQ: a
                    }));
                }).catch((err) => {
                    console.error(err);
                    setStatus(false);
                })
            break;
            default:break;
        }
    }

    getMembersList = () => {
        switch(this.state.searchMode) {
            case 'GLOBAL':
                return this.state.membersQ || [];
            case 'LOCAL':
               return this.state.membersQ || this.state.members;
            default:break;
        }

        return [];
    }

    addToDesk = targetID => {
        this.setState(({ membersQ: a }) => ({ membersQ: a.filter(io => io.id !== targetID) }));

        const castError = (err) => {
            if(err) console.error(err);
            this.props.castInfo({
                iconStyle: "error",
                icon: faBomb,
                text: "Ooh. We couldn't add this user to the desk. Please, try again.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => null // modal closes automatically
                    }
                ]
            })
        }

        client.mutate({
            mutation: gql`
                mutation($deskID: ID!, $targetID: ID!) {
                    addUserToDesk(deskID: $deskID, targetID: $targetID) {
                        id,
                        ${ this.userFields }
                    }
                }
            `,
            variables: {
                deskID: this.props.deskid,
                targetID
            }
        }).then(({ data: { addUserToDesk: a } }) => {
            if(!a) return castError();

            this.setState(({ members: _a }) => ({
                members: [
                    a,
                    ..._a
                ]
            }));
        }).catch(castError);
    }

    removeFromDesk = targetID => {
        this.setState(({ members: a }) => ({ members: a.filter(io => io.id !== targetID) }));

        const castError = (err) => {
            if(err) console.error(err);
            this.props.castInfo({
                iconStyle: "error",
                icon: faBomb,
                text: "Ooh. We couldn't remove this user from the desk. Please, try again.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => null // modal closes automatically
                    }
                ]
            })
        }

        client.mutate({
            mutation: gql`
                mutation($deskID: ID!, $targetID: ID!) {
                    removeUserFromDesk(deskID: $deskID, targetID: $targetID) {
                        id
                    }
                }
            `,
            variables: {
                deskID: this.props.deskid,
                targetID
            }
        }).then(({ data: { removeUserFromDesk: a } }) => {
            if(!a) return castError();
        }).catch(castError);
    }

    render() {
        return(
            <>
                <div onClick={ this.props.onClose } className={constructClassName({
                    "rn-desk-membersmod_bg": true,
                    "active": this.props.visible
                })} />
                <div className="rn-desk-membersmod">
                    <div className="rn-desk-membersmod-search">
                        <input
                            type="text"
                            className="definp"
                            ref={ ref => this.searchMatRef = ref }
                            placeholder="Search people by email or name..."
                            onInput={({ target: a }) => { // onChange @clear=change(update)> F%fires
                                clearTimeout(a.submitINT);
                                a.submitINT = setTimeout(() => this.searchPeople(a.value), 250);
                            }}
                        />
                        <div>
                            <FontAwesomeIcon icon={ faSearch } />
                        </div>
                    </div>
                    <div className="rn-desk-membersmod-plist">
                        {
                            (this.state.members && !this.state.isSearching) ? (
                                <>
                                    {
                                        (this.state.searchMode !== "GLOBAL") ? null : (
                                            <MembersModalItem
                                                isAddon={ true }
                                                addonStyle="blue"
                                                addonIcon={ faArrowLeft }
                                                addonText="Back to the desk owners"
                                                onClick={ () => this.setSearchMode("LOCAL") }
                                            />
                                        )    
                                    }
                                    {
                                        this.getMembersList().map(({ id, name, avatar }) => (
                                            <MembersModalItem
                                                key={ id }
                                                name={ name }
                                                avatar={ avatar }
                                                canDelete={ this.state.searchMode === "LOCAL" && this.props.deskcreatorid === this.clientID && this.clientID !== id }
                                                canAdd={ this.state.searchMode === "GLOBAL" && this.props.deskcreatorid === this.clientID && this.clientID !== id }
                                                onAdd={ () => this.addToDesk(id) }
                                                onDelete={ () => this.removeFromDesk(id) }
                                            />
                                        ))
                                    }
                                    {
                                        (this.state.searchMode !== "LOCAL") ? null : (
                                            <MembersModalItem
                                                isAddon={ true }
                                                addonStyle="green"
                                                addonIcon={ faPlus }
                                                addonText="Add a new contributor"
                                                onClick={ () => this.setSearchMode("GLOBAL") }
                                            />
                                        )    
                                    }
                                </>
                            ) : (
                                <LoadIcon />
                            )
                        }
                    </div>
                </div>
            </>
        );
    }
}

class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            desk: null,
            selectedCard: null,
            addingCard: false,
            cardModifyData: null,
            cardProcessing: false,
            cardDeleting: false,
            deletingDesk: false,
            membersModal: false
        }

        this.clientID = JSON.parse(cookieControl.get('userdata')).id;

        this.cardQuery = `
            id,
            creator {
                id,
                name
            },
            fronttext,
            backtext,
            addtime,
            updatetime,
            showtimes
        `;
    }

    componentDidMount() {
        this._isMounted = true;
        this.fetchDesk(this.props.match.params.id);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    fetchDesk = id => {
        client.query({
            query: gql`
                query($id: ID!) {
                    getDesk(id: $id) {
                        id,
                        name,
                        playedTimes,
                        cardsInt,
                        ownersInt,
                        cards {
                            ${ this.cardQuery }
                        },
                        creator {
                            id,
                            name
                        }
                    }
                }
            `,
            variables: { id }
        }).then(({ data: { getDesk: a } }) => {
            if(!a) return this.props.history.push(links["DASHBOARD_PAGE"].absolute);

            if(this._isMounted) {
                this.setState(() => ({
                    desk: a
                }));
            }
        }).catch(console.error);
    }

    selectCard = id => this.setState(({ selectedCard: a }) => ({
        selectedCard: (id !== null && a !== id) ? id : null
    }));

    updateDeskName = name => {
        client.mutate({
            mutation: gql`
                mutation($name: String!, $id: ID!) {
                    updateDeskName(name: $name, id: $id) {
                        id,
                        name
                    }
                }
            `,
            variables: {
                name,
                id: this.state.desk.id
            }
        }).then(({ data: { updateDeskName: a } }) => {
            if(!a) return null;

            this.setState(({ desk: _a }) => ({
                desk: {
                    ..._a,
                    ...a
                }
            }));
        }).catch(console.error);
    }

    addDeskCard = ({ front, back }) => {
        if(this.state.cardProcessing) return;
        this.setState(() => ({ cardProcessing: true }));

        client.mutate({
            mutation: gql`
                mutation($id: ID!, $front: String!, $back: String!) {
                    addDeskCard(deskID: $id, front: $front, back: $back) {
                        ${ this.cardQuery }
                    }
                }
            `,
            variables: {
                id: this.state.desk.id,
                front, back
            }
        }).then(({ data: { addDeskCard: a } }) => {
            this.setState(() => ({ cardProcessing: false }));
            if(!a) return null;

            this.setState(({ desk, desk: { cards } }) => ({
                desk: {
                    ...desk,
                    cards: [
                        a,
                        ...cards
                    ]
                }
            }));
        }).catch(console.error);
    }

    modifyDeskCard = ({ front, back }) => {
        if(this.state.cardProcessing || !this.state.selectedCard) return;
        this.setState(() => ({ cardProcessing: true }));

        client.mutate({
            mutation: gql`
                mutation($cardID: ID!, $deskID: ID!, $front: String!, $back: String!) {
                    updateCardContent(id: $cardID, deskID: $deskID, front: $front, back: $back) {
                        ${ this.cardQuery }
                    }
                }
            `,
            variables: {
                cardID: this.state.selectedCard,
                deskID: this.state.desk.id,
                front, back
            }
        }).then(({ data: { updateCardContent: a } }) => {
             this.setState(() => ({
                cardProcessing: false
            }));
            if(!a) return null;

            const b = Array.from(this.state.desk.cards);
            b[b.findIndex(io => io.id === a.id)] = a;
            this.setState(({ desk }) => ({
                desk: {
                    ...desk,
                    cards: b
                }
            }));      
        }).catch((err) => {
            console.error(err);
            this.setState(() => ({ cardProcessing: false }));
        });
    }

    deleteSelectedCard = () => {
        if(this.state.cardDeleting || !this.state.selectedCard) return;
        this.setState(() => ({ cardDeleting: true }));

        client.mutate({
            mutation: gql`
                mutation($id: ID!, $deskID: ID!) {
                    deleteCard(id: $id, deskID: $deskID) {
                        id
                    }
                }
            `,
            variables: {
                id: this.state.selectedCard,
                deskID: this.state.desk.id
            }
        }).then(({ data: { deleteCard: a } }) => {
            this.setState(() => ({ cardDeleting: false }));
            if(!a) return null;

            const b = Array.from(this.state.desk.cards);
            b.splice(b.findIndex(io => io.id === a.id), 1);
            this.selectCard(null);

            this.setState(({ desk }) => ({
                desk: {
                    ...desk,
                    cards: b
                }
            }));
        }).catch((err) => {
            console.error(err);
            this.setState(() => ({ cardDeleting: false }));
        });
    }

    deleteDesk = () => {
        if(this.state.deletingDesk || !this.state.desk || this.clientID !== this.state.desk.creator.id) return;

        this.setState(() => ({ deletingDesk: true }));

        client.mutate({
            mutation: gql`
                mutation($id: ID!) {
                    deleteDesk(id: $id) {
                        id
                    }
                }
            `,
            variables: {
                id: this.state.desk.id
            }
        }).then(({ data: { deleteDesk: a } }) => {
            this.setState(() => ({ deletingDesk: false }));
            if(!a) {
                this.props.goDialog({
                    iconStyle: "error",
                    icon: faBomb,
                    text: "Error. We couldn't delete this desk. Please, try again.",
                    buttons: [
                        {
                            text: "Continue",
                            onClick: () => null // modal closes automatically
                        }
                    ]
                });

                return;
            }

            this.props.history.push(links["DASHBOARD_PAGE"].absolute);
        }).catch((err) => {
            console.error(err);
            this.setState(() => ({ deletingDesk: false }));
        });
    }
    
    render() {
        return(
            <>
                <AddCardModal
                    activeStatus={ this.state.addingCard }
                    submitCard={(data) => {
                        const a = this.state.addingCard;

                        switch(a) {
                            case 'ADD':
                                this.addDeskCard(data);
                            break;
                            case 'MODIFY':
                                this.modifyDeskCard(data);
                            break;
                            default:break;
                        }
                    }}
                    cardModifyData={ this.state.cardModifyData }
                    onClose={ () => this.setState({ addingCard: false, cardModifyData: null }) }
                />
                <MembersModal
                    visible={ this.state.membersModal }
                    onClose={ () => this.setState({ membersModal: false }) }
                    castInfo={ this.props.goDialog }
                    deskid={ this.state.desk && this.state.desk.id }
                    deskcreatorid={ this.state.desk && this.state.desk.creator.id }
                />
                <div className="rn rn-desk">
                    {
                        (this.state.desk) ? (
                            <>
                                <Cover
                                    cards={ this.state.desk.cardsInt }
                                    members={ this.state.desk.ownersInt }
                                    creatorName={ this.state.desk.creator.name }
                                    deskName={ this.state.desk.name }
                                    playedt={ this.state.desk.playedTimes }
                                    updateName={ this.updateDeskName }
                                    requestMembers={ () => this.setState({ membersModal: true }) }
                                />
                                <Cards
                                    cards={ this.state.desk.cards }
                                    selectCard={ this.selectCard }
                                    selectedCard={ this.state.selectedCard }
                                />
                                <div className="rn-desk-circlecon">
                                    {
                                        [
                                            {
                                                icon: faPlus,
                                                onClick: () => this.setState({ addingCard: "ADD" }),
                                                info: "Add a new card",
                                                loading: this.state.cardProcessing
                                            },
                                            {
                                                icon: faPen,
                                                info: "Edit selected card",
                                                noRender: this.state.selectedCard === null,
                                                onClick: (e) => {
                                                    const a = this.state.desk.cards.find(io => (
                                                        io.id === this.state.selectedCard
                                                    ));
                                                    if(!a) return;

                                                    const { fronttext: front, backtext: back } = a;

                                                    this.setState(() => ({
                                                        addingCard: "MODIFY",
                                                        cardModifyData: { front, back }
                                                    }))
                                                }
                                            },
                                            {
                                                icon: faTrash,
                                                info: "Delete selected card",
                                                noRender: this.state.selectedCard === null,
                                                classNames: "delete-act",
                                                onClick: this.deleteSelectedCard,
                                                loading: this.state.cardDeleting
                                            },
                                            {
                                                icon: faPlay,
                                                info: "Play desk",
                                                noRender: !this.state.desk.cards.length,
                                                onClick: () => this.props.history.push(`${ links["PLAY_DESK_PAGE"].absolute }/${ this.state.desk.id }`)
                                            },
                                            {
                                                icon: faBurn,
                                                info: "Destroy this desk",
                                                classNames: "delete-act",
                                                noRender: this.clientID !== this.state.desk.creator.id,
                                                loading: this.state.deletingDesk,
                                                onClick: () => {
                                                    this.props.goDialog({
                                                        iconStyle: "warning",
                                                        icon: faSkullCrossbones,
                                                        text: "Are you sure you want to terminate this desk?",
                                                        buttons: [
                                                            {
                                                                color: 'safe',
                                                                text: "Cancel",
                                                                onClick: () => null
                                                            },
                                                            {
                                                                color: 'danger',
                                                                text: "Continue",
                                                                onClick: this.deleteDesk
                                                            }
                                                        ]
                                                    });
                                                }
                                            }
                                        ].map(({ icon, onClick, noRender, loading, classNames, info }, index) => (!noRender) ? (
                                            <button
                                                key={ index }
                                                className={constructClassName({
                                                    "rn-desk-circlecon-item definp": true,
                                                    "loading": loading,
                                                    [classNames]: !!classNames
                                                })}
                                                onClick={ onClick }
                                                disabled={ loading || false }>
                                                <FontAwesomeIcon icon={ icon } />
                                                <span className="rn-desk-circlecon-item-info">
                                                    { info }
                                                </span>
                                            </button>
                                        ) : null)
                                    }
                                </div>
                            </>
                        ) : (
                            <LoadIcon
                                style={{
                                    marginTop: "15px"
                                }}
                            />
                        )
                    }
                </div>
            </>
        );
    }
}

const mapStateToProps = () => ({});

const mapActionsToProps = {
    goDialog: payload => ({ type: 'SHOW_DIALOG_MODAL', payload })
}

export default connect(
    mapStateToProps,
    mapActionsToProps
)(Hero);