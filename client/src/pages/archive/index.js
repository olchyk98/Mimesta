import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import { gql } from 'apollo-boost';
import { connect } from 'react-redux';

import { constructClassName, convertTime } from '../../utils';
import links from '../../links';
import client from '../../apollo';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faEraser, faBomb } from '@fortawesome/free-solid-svg-icons';

import LoadIcon from '../__forall__/loadicon';

const cardsLimit = 20;

class ControlsButton extends PureComponent {
    render() {
        return(
            <button
                disabled={ this.props.disabled }
                className={constructClassName({
                "rn-archive-controls-btn definp": true,
                "disabled": this.props.disabled,
                "active": this.props.active
            })} onClick={ this.props.onClick }>
                <FontAwesomeIcon icon={ this.props.icon } />
            </button>
        );
    }
}

ControlsButton.propTypes = {
    icon: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired
}

class Controls extends PureComponent {
    render() {
        return(
            <menu className="rn-archive-controls">
                {
                    [
                        {
                            icon: faEdit,
                            disabled: false,
                            active: this.props.editingMode,
                            onClick: this.props.toggleEdit
                        },
                        {
                            icon: faEraser,
                            disabled: !this.props.selectedCard,
                            active: false,
                            onClick: this.props.eraseCard
                        }
                    ].map(({ icon, active, disabled, onClick }, index) => (
                        <ControlsButton
                            key={ index }
                            icon={ icon }
                            active={ active }
                            disabled={ disabled }
                            onClick={ onClick }
                        />       
                    ))
                }
            </menu>
        );
    }
}

class Search extends PureComponent {
    render() {
        return(
            <div className={constructClassName({
                    "rn-archive-search": true,
                    "loading": this.props.isLoading
                })}>
                <div>
                    <FontAwesomeIcon icon={ faSearch } />
                </div>
                <input
                    className="definp"
                    placeholder="Search"
                    disabled={ this.props.isLoading }
                    onChange={({ target }) => {
                          clearTimeout(target.loadingINT);
                          target.loadingINT = setTimeout(() => this.props.onSearch(target.value), 300);
                    }}
                />
            </div>
        );
    }
}

class CardsField extends PureComponent {
    render() {
        return(
            <td
                onKeyDown={(e) => {
                    if(e.keyCode === 13 || e.target.textContent.length + 1 > 75) {
                        e.preventDefault();
                    }
                }}
                contentEditable={ this.props.editing }
                onBlur={({ target }) => {
                    const a = target.textContent;

                    if(!a || !a.replace(/\s|\n/g, "").length) {
                        target.textContent = this.props.value;
                    } else if(a !== this.props.value) {
                        this.props.onUpdate(a);
                    }
                }}
                suppressContentEditableWarning={ this.props.editing }>{ this.props.value }</td>
        );
    }
}

CardsField.propTypes = {
   value: PropTypes.string.isRequired,
   editing: PropTypes.bool.isRequired,
   onUpdate: PropTypes.func.isRequired
}

class Cards extends PureComponent {
    render() {
        return(
            <section className="rn-archive-table">
                {
                    (!this.props.isLoading) ? (
                        <table className="rn-desk-cards-mat">
                            <tbody>
                                <tr>
                                    <th>Front side</th>
                                    <th>Back side</th>
                                    <th>Added</th>
                                    <th>Last update</th>
                                    <th>Played times</th>
                                    <th>Desk</th>
                                    <th>Created by</th>
                                </tr>
                                {
                                    this.props.cards.map(({ id, fronttext, backtext, updatetime, showtimes, addtime, creator: { name: crname }, desk: { id: deskid, name: deskname } }) => (
                                        <tr
                                            key={ id }
                                            className={ (this.props.selectedCard !== id) ? "" : "selected" }
                                            onClick={ () => this.props.selectCard(id) }>
                                            <CardsField
                                                editing={ this.props.editMode }
                                                value={ fronttext }
                                                onUpdate={ value => this.props.updateCard(id, value, deskid, 'front') }
                                            />
                                            <CardsField
                                                editing={ this.props.editMode }
                                                value={ backtext }
                                                onUpdate={ value => this.props.updateCard(id, value, deskid, 'back') }
                                            />
                                            <td>{ convertTime(addtime, 1) }</td>
                                            <td>{ (updatetime !== addtime) ? convertTime(updatetime, 1) : "wasn't updated yet" }</td>
                                            <td>{ showtimes.toString() }</td>
                                            <td>{ deskname }</td>
                                            <td>{ crname }</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    ) : (
                        <LoadIcon />
                    )
                }
            </section>
        );
    }
}

// TODO: Infinite scroll
class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            cards: null,
            isLoading: true,
            editingMode: false,
            selectedCard: null
        }

        this.cardQuery = `
            fronttext,
            backtext,
            updatetime,
            showtimes,
            addtime,
            desk {
                id,
                name
            },
            creator {
                id,
                name
            }
        `;

        this.deletingCard = false;
    }

    componentDidMount() {
        this.loadCards(true);
    }

    loadCards = (force = false) => {
        if(this.state.isLoading && !force) return;

        this.setState(() => ({
            isLoading: true
        }));

        const castError = (err = null) => {
            if(err) console.error(err);
            this.props.goDialog({
                iconStyle: "error",
                icon: faBomb,
                text: "We couldn't load your archive. Please, try later.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => null // modal closes automatically
                    }
                ]
            });
            this.props.history.push(links["DASHBOARD_PAGE"].absolute);
        }

        client.query({
            query: gql`
                query($limit: Int!) {
                    user {
                        id,
                        availableCards(limit: $limit) {
                            id,
                            ${ this.cardQuery }
                        }
                    }
                }
            `,
            variables: {
                limit: cardsLimit
            }
        }).then(({ data: { user: a } }) => {
            if(!a || !a.availableCards) {
                castError();
                return;
            }

            this.setState(() => ({
                cards: a.availableCards,
                isLoading: false,
                deskID: a.deskid
            }));
        }).catch((err) => {
            castError(err);
        });
    }

    updateCardValue = (id, content, deskID, side) => {
        const castError = (err = null) => {
            if(err) console.error(err);
            this.props.goDialog({
                iconStyle: "error",
                icon: faBomb,
                text: "We couldn't update this card, please try later.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => null // modal closes automatically
                    }
                ]
            });
        }

        client.mutate({
            mutation: gql`
                mutation($id: ID!, $deskID: ID!, $front: String, $back: String) {
                    updateCardContent(id: $id, deskID: $deskID, front: $front, back: $back) {
                        id,
                        ${ this.cardQuery }
                    }
                }
            `,
            variables: {
                id: id,
                deskID: deskID,
                front: (side === 'front') ? content : '',
                back: (side === 'back') ? content : ''
            }
        }).then(({ data: { updateCardContent: a } }) => {
            if(!a) return castError();

            const b = Array.from(this.state.cards);
            b[b.findIndex(io => io.id === a.id)] = a;

            this.setState(() => ({
                cards: b
            }));
        }).catch((err) => {
            console.error(err);
            castError();
        });
    }

    eraseSelectedCard = () => {
        if(this.deletingCard || this.state.selectedCard === null) return;
        this.deletingCard = true;

        const card = this.state.cards.find(io => io.id === this.state.selectedCard);
        if(!card) return;

        const castError = (err = null) => {
            if(err) console.error(err);
            this.props.goDialog({
                iconStyle: "error",
                icon: faBomb,
                text: "We couldn't delete this card, please try later.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => null // modal closes automatically
                    }
                ]
            });
        }

        client.mutate({
            mutation: gql`
                mutation($id: ID!, $deskID: ID!) {
                    deleteCard(id: $id, deskID: $deskID) {
                        id
                    }
                }
            `,
            variables: {
                id: card.id,
                deskID: card.desk.id
            }
        }).then(({ data: { deleteCard: a } }) => {
            this.deletingCard = false;
            if(!a) return castError();

            const b = Array.from(this.state.cards);
            b.splice(b.findIndex(io => io.id === card.id), 1);
            this.setState(() => ({
                cards: b,
                selectedCard: null
            }));
        }).catch((err) => {
            this.deletingCard = false;
            console.error(err);
            castError();
        });
    }

    searchCard = query => {
        const castError = (err = null) => {
            if(err) console.error(err);
            this.props.goDialog({
                iconStyle: "error",
                icon: faBomb,
                text: "We couldn't update this card, please try later.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => null // modal closes automatically
                    }
                ]
            });
        }

        client.query({
            query: gql`
                query($query: String!) {
                    searchCards(query: $query) {
                        id,
                        ${ this.cardQuery }
                    }
                }
            `,
            variables: { query }
        }).then(({ data: { searchCards: a } }) => {
            if(!a) return castError();

            this.setState(() => ({
                cards: a
            }));
        }).catch((err) => {
            console.error(err);
            castError();
        });
    }

    render() {
        return(
            <div className="rn rn-archive">
                <Controls
                    editingMode={ this.state.editingMode }
                    selectedCard={ !!this.state.selectedCard }
                    eraseCard={ this.eraseSelectedCard }
                    toggleEdit={() => {
                        this.setState(({ editingMode: a, selectedCard: b }) => ({
                            editingMode: !a,
                            selectedCard: (!a) ? null : b
                        }));
                    }}
                />
                <Search
                    disabled={ this.state.isLoading }
                    onSearch={ query => this.searchCard(query) }
                />
                <Cards
                    updateCard={ this.updateCardValue }
                    isLoading={ this.state.isLoading }
                    cards={ this.state.cards }
                    selectedCard={ this.state.selectedCard }
                    editMode={ this.state.editingMode }
                    selectCard={(id) => {
                        if(this.state.editingMode) return;

                        this.setState(({ selectedCard }) => ({
                            selectedCard: (selectedCard !== id) ? id : null
                        }));
                    }}
                />
            </div>
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