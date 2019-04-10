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

const cardsLimit = 20;

class ControlsButton extends PureComponent {
    render() {
        return(
            <button className={constructClassName({
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
                            onClick: () => null
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
            <div className="rn-archive-search">
                <div>
                    <FontAwesomeIcon icon={ faSearch } />
                </div>
                <input
                    className="definp"
                    placeholder="Search"
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
                        alert("UPDATE"); // TODO
                    }
                }}
                suppressContentEditableWarning={ this.props.editing }>{ this.props.value }</td>
        );
    }
}

CardsField.propTypes = {
   value: PropTypes.string.isRequired,
   editing: PropTypes.bool.isRequired
}

class Cards extends PureComponent {
    render() {
        return(
            <section className="rn-archive-table">
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
                            (!this.props.isLoading) ? (
                                this.props.cards.map(({ id, fronttext, backtext, updatetime, showtimes, addtime, creator: { name: crname } }) => (
                                    <tr
                                        key={ id }
                                        className={ (this.props.selectedCard !== id) ? "" : "selected" }
                                        onClick={ () => this.props.selectCard(id) }>
                                        <CardsField editing={ this.props.editMode } value={ fronttext } />
                                        <CardsField editing={ this.props.editMode } value={ backtext } />
                                        <CardsField editing={ false } value={ convertTime(addtime, 1) } />
                                        <CardsField editing={ false } value={ (updatetime !== addtime) ? convertTime(updatetime, 1) : "wasn't updated yet" } />
                                        <CardsField editing={ false } value={ showtimes.toString() } />
                                        <CardsField editing={ false } value={ crname } />
                                    </tr>
                                ))
                            ) : (
                                null
                            )
                        }
                    </tbody>
                </table>
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
                            fronttext,
                            backtext,
                            updatetime,
                            showtimes,
                            addtime,
                            creator {
                                id,
                                name
                            }
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
                isLoading: false
            }));
        }).catch((err) => {
            castError(err);
        });
    }

    render() {
        return(
            <div className="rn rn-archive">
                <Controls
                    editingMode={ this.state.editingMode }
                    selectedCard={ !!this.state.selectedCard }
                    toggleEdit={() => {
                        this.setState(({ editingMode: a, selectedCard: b }) => ({
                            editingMode: !a,
                            selectedCard: (!a) ? null : b
                        }));
                    }}
                />
                <Search />
                <Cards
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