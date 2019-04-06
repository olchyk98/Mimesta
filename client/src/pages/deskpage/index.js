import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faPen } from '@fortawesome/free-solid-svg-icons';

class Cover extends PureComponent {
    render() {
        return(
            <section className="rn-desk-cover">
                <input
                    className="rn-desk-cover-title definp"
                    defaultValue="Untitled desk"
                    maxLength="30"
                />
                <div className="rn-desk-cover-info">
                    <span>32 cards</span>
                    <span>•</span>
                    <span>played 120 times</span>
                    <span>•</span>
                    <span>4 members</span>
                    <span>•</span>
                    <span>created by Oles Odynets</span>
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
                            this.props.cards.map(({ front, back, added, updated, played, created }, index) => (
                                <tr
                                    key={ index }
                                    className={ (this.props.selectedCard !== index) ? "" : "selected" }
                                    onClick={ () => this.props.selectCard(index) }>
                                    <td>{ front }</td>
                                    <td>{ back }</td>
                                    <td>{ added }</td>
                                    <td>{ updated }</td>
                                    <td>{ played }</td>
                                    <td>{ created }</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </section>
        );
    }
}

class Hero extends Component {
    constructor(props) {
        super(props);

        this.cards = [];
        for(let ma = 0; ma < 30; ma++) this.cards.push({
            front: "January",
            back: "MyQuote",
            added: "32 June 2024",
            updated: "72 February 2068",
            played: "593",
            created: "Oles Odynets"
        });

        this.state = {
            cards: this.cards,
            selectedCard: null
        }
    }

    selectCard = id => this.setState({ selectedCard: id })
    
    render() {
        return(
            <>
                <div className="rn rn-desk">
                    <Cover />
                    <Cards
                        cards={ this.state.cards }
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
                                    onClick: () => null
                                },
                                {
                                    id: 2,
                                    icon: faPen,
                                    noRender: this.state.selectedCard === null,
                                    onClick: () => null
                                },
                                {
                                    id: 3,
                                    icon: faPlay,
                                    onClick: () => null
                                }
                            ].map(({ id, icon, onClick, noRender }) => (!noRender) ? (
                                <button
                                    key={ id }
                                    className="rn-desk-circlecon-item definp"
                                    onClick={ onClick }>
                                    <FontAwesomeIcon icon={ icon } />
                                </button>
                            ) : null)
                        }
                    </div>
                </div>
            </>
        );
    }
}

export default Hero;