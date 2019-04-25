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
    faSearch
} from '@fortawesome/free-solid-svg-icons';

import client from '../../apollo';
import links from '../../links';
import { cookieControl, constructClassName, convertTime } from '../../utils';

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
                    <span onClick={ this.props.requestMembers }>{ this.props.members } member{ (this.props.members !== 1) ? "s" : "" }</span>
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
            <div className={constructClassName({
                "rn-desk-membersmod-plist-item": true,
                "const": this.props.isAddon

            })}>
                {
                    (this.props.isAddon) ? (
                        <>
                            <div className="rn-desk-membersmod-plist-item-icinc icon">
                                <FontAwesomeIcon icon={ faPlus } />
                            </div>
                            <span>Add a new contributor</span>
                        </>
                    ) : (
                        <>
                            <div className="rn-desk-membersmod-plist-info">
                                <div className="rn-desk-membersmod-plist-item-icinc">
                                    <img src={ "data:image/jpeg;base64,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" } />
                                </div>
                                <span>Oles Odynets</span>
                            </div>
                            {
                                (!this.props.isAdmin && false) ? null : ( // TODO: check for self
                                    <div className="rn-desk-membersmod-plist-remove">
                                        <FontAwesomeIcon icon={ faTrash } />
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
    render() {
        return(
            <>
                <div className="rn-desk-membersmod_bg active"></div>
                <div className="rn-desk-membersmod">
                    <div className="rn-desk-membersmod-search">
                        <input
                            type="text"
                            className="definp"
                            placeholder="Search for people"
                        />
                        <div>
                            <FontAwesomeIcon icon={ faSearch } />
                        </div>
                    </div>
                    <div className="rn-desk-membersmod-plist">
                        <MembersModalItem
                            isAddon={ false }
                        />
                        <MembersModalItem
                            isAddon={ true }
                        />
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
                <MembersModal />
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
                                                        text: "Are you sure that you want to terminate this desk?",
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