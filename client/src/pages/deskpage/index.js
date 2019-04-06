import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faPen, faCheck, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import client from '../../apollo';
import links from '../../links';
import { constructClassName } from '../../utils';

import { gql } from 'apollo-boost';

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
                    <span>played 120 times</span>
                    <span>•</span>
                    <span>{ this.props.members } member{ (this.props.members !== 1) ? "s" : "" }</span>
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
                onBlur={ this.props.onBlur }
                onFocus={ this.props.onFocus }
                className="rn-desk-cards definp"
                tabIndex="-1">
                <table className="rn-desk-cards-mat">
                    <tbody>
                        <tr>
                            <th>Front side</th>
                            <th>Back side</th>
                            <th>Added</th>
                            <th>Updated</th>
                            <th>Played times</th>
                            <th>Created by</th>
                        </tr>
                        {
                            this.props.cards.map(({ id, fronttext, backtext, updatedtime, showtimes, addtime, creator: { name: crname } }) => (
                                <tr
                                    key={ id }
                                    className={ (this.props.selectedCard !== id) ? "" : "selected" }
                                    onClick={ () => this.props.selectCard(id) }>
                                    <td>{ fronttext }</td>
                                    <td>{ backtext }</td>
                                    <td>{ addtime }</td>
                                    <td>{ updatedtime || "wasn't updated yet" }</td>
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
            cardFront: "",
            cardBack: "",
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
            const a = (
                this.state.cardFront &&
                this.state.cardFront.replace(/\s|\n/g).length &&
                this.state.cardBack &&
                this.state.cardBack.replace(/\s|\n/g).length
            );

            if(this.state.canSubmit !== a) this.setState({ canSubmit: a });
        }

        // Reset state when modal is activating
        if(!pprops.activeStatus && this.props.activeStatus) this.reset();
    }

    reset = () => {
        this.setState(this.initialState);
        for(let ma of Object.values(this.sidesRef)) ma.textContent = "";
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
                                    front: this.state.cardFront,
                                    back: this.state.cardBack
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
                                className="definp rn-desk-addcardmod-card-target"
                                onInput={ ({ target: { textContent: a } }) => this.setState({ cardFront: a }) }
                                ref={ ref => this.sidesRef.front = ref }
                            >{""}</h1>
                        </div>
                        <div className="rn-desk-addcardmod-card-side back">
                            <h1
                                suppressContentEditableWarning={ true }
                                contentEditable={ true }
                                placeholder="Start typing..."
                                className="definp rn-desk-addcardmod-card-target"
                                onInput={ ({ target: { textContent: a } }) => this.setState({ cardBack: a }) }
                                ref={ ref => this.sidesRef.back = ref }
                            >{""}</h1>
                        </div>
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
            cardProcessing: false
        }
    }

    componentDidMount() {
        this.fetchDesk(this.props.match.params.id);
    }

    fetchDesk = id => {
        client.query({
            query: gql`
                query($id: ID!) {
                    getDesk(id: $id) {
                        id,
                        name,
                        cardsInt,
                        ownersInt,
                        cards {
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

            this.setState(() => ({
                desk: a
            }));
        }).catch(console.error);
    }

    selectCard = id => this.setState({ selectedCard: id })

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
        if(this.state.cardProcessing) return;
        this.setState(() => ({ cardProcessing: true }));

        client.mutate({
            mutation: gql`
                mutation($cardID: ID!) {

                }
            `
        })
    }
    
    render() {
        return(
            <>
                <AddCardModal
                    activeStatus={ this.state.addingCard }
                    submitCard={() => {
                        const a = this.state.addingCard;

                        switch(a) {
                            case 'ADD':
                                this.addDeskCard();
                            break;
                            case 'MODIFY':
                                this.modifyDeskCard();
                            break;
                            default:break;
                        }
                    }}
                    onClose={ () => this.setState({ addingCard: false, cardModifyData: null }) }
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
                                    updateName={ this.updateDeskName }
                                />
                                <Cards
                                    cards={ this.state.desk.cards }
                                    selectCard={ this.selectCard }
                                    selectedCard={ this.state.selectedCard }
                                    onBlur={ () => this.selectCard(null) }
                                />
                                <div className="rn-desk-circlecon">
                                    {
                                        [
                                            {
                                                id: 1,
                                                icon: faPlus,
                                                onClick: () => this.setState({ addingCard: "ADD" }),
                                                loading: this.state.cardProcessing
                                            },
                                            {
                                                id: 2,
                                                icon: faPen,
                                                noRender: this.state.selectedCard === null,
                                                onClick: () => {
                                                    this.setState(() => ({
                                                        addingCard: "MODIFY",
                                                        cardModifyData: this.state.desk.cards.find(io => (
                                                            io.id === this.state.selectedCard
                                                        ))
                                                    }))
                                                }
                                            },
                                            {
                                                id: 3,
                                                icon: faPlay,
                                                onClick: () => null
                                            }
                                        ].map(({ id, icon, onClick, noRender, loading }) => (!noRender) ? (
                                            <button
                                                key={ id }
                                                className={constructClassName({
                                                    "rn-desk-circlecon-item definp": true,
                                                    "loading": loading
                                                })}
                                                onClick={ onClick }
                                                disabled={ loading || false }>
                                                <FontAwesomeIcon icon={ icon } />
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

export default Hero;