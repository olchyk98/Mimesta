import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import { shortNumber } from '../../utils';
import client from '../../apollo';
import links from '../../links';

import { gql } from 'apollo-boost';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import Desk from '../__forall__/desk';

import placeholder from '../__forall__/placeholder.gif';

class StatsCard extends PureComponent {
    render() {
        return(
            <article className="rn-dashboard-stats-item" style={{
                animationDelay: this.props.index * 0.25 + 's'
            }}>
                <div className="rn-dashboard-stats-item-icon">
                    <FontAwesomeIcon icon={ this.props.icon } />
                </div>
                <h3 className="rn-dashboard-stats-item-value">{ this.props.value }</h3>
                <span className="rn-dashboard-stats-item-title">{ this.props.title }</span>
            </article>
        );
    }
}

StatsCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired
    ]),
    icon: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
}

class Stats extends Component {
    render() {
        return(
            <>
                <h2 className="rn-dashboard-toptitle">Analytics Overview for this month</h2>
                <section className="rn-dashboard-section rn-dashboard-stats">
                    {
                        [
                            {
                                icon: faPlay,
                                title: "Learned cards",
                                value: this.props.learnedCards
                            },
                            {
                                icon: faPlus,
                                title: "Added cards",
                                value: this.props.addedCards
                            },
                            {
                                icon: faClock,
                                title: "Minutes",
                                value: this.props.playedMinutes
                            }
                        ].map(({ icon, title, value }, index) => (
                            <StatsCard
                                key={ index }
                                index={ index }
                                icon={ icon }
                                title={ title }
                                value={ shortNumber(value) }
                            />
                        ))
                    }
                </section>
            </>
        );
    }
}

class Desks extends PureComponent {
    constructor(props) {
        super(props);

        this.creatingDesk = false;
    }

    createDesk = () => {
        if(this.creatingDesk) return;

        this.creatingDesk = true;

        client.mutate({
            mutation: gql`
                mutation {
                    createDesk {
                        id
                    }
                }
            `
        }).then(({ data: { createDesk: a } }) => {
            this.createDesk = false;

            if(!a) return;

            this.props.pushLink(`${ links["DESK_PAGE"].absolute }/${ a.id }`);
        }).catch((err) => {
            console.error(err);
            this.creatingDesk = false;
        });
    }

    render() {
        return(
            <>
                <h2 className="rn-dashboard-toptitle">Your desks</h2>
                <section className="rn-dashboard-section rn-dashboard-desks">
                    {
                        (!this.props.isLoading) ? (
                            <>
                                {
                                    this.props.desks.map(({ id, name, cardsInt }) => (
                                        <Desk
                                            key={ id }
                                            id={ id }
                                            name={ name }
                                            cards={ cardsInt }
                                        />
                                    ))
                                }
                                <button
                                    className="rn-dashboard-desks-additem definp"
                                    onClick={ this.createDesk }>
                                    <FontAwesomeIcon icon={ faPlus } />
                                </button>
                            </>
                        ) : (
                            (() => {
                                let a = [];

                                for(let ma = 0; ma < 2; ma++) a.push(
                                    <img
                                        key={ ma }
                                        src={ placeholder }
                                        alt="placeholder"
                                        className="rn-dashboard-desks-placeholderit"
                                    />
                                );
                                
                                return a;
                            })()
                        )
                    }
                </section>
            </>
        );
    }
}

class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            desks: false,
            learnedCards: null,
            addedCards: null,
            playedMinutes: null
        }
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData = () => {
        client.query({
            query: gql`
                query {
                    user {
                        id,
                        learnedCardsMonth,
                        playedSecondsMonth,
                        addedCardsMonth,
                        desks {
                            id,
                            name,
                            cardsInt
                        }
                    }
                }
            `
        }).then(({ data: { user: a } }) => {
            if(!a) return;

            this.setState(() => ({
                learnedCards: a.learnedCardsMonth,
                addedCards: a.addedCardsMonth,
                playedMinutes: Math.floor(a.playedSecondsMonth / 60),
                desks: a.desks
            }));
        }).catch(console.error);
    }

    render() {
        return(
            <div className="rn rn-dashboard">
                <Stats
                    learnedCards={ (Number.isInteger(this.state.learnedCards)) ? this.state.learnedCards : "..." }
                    addedCards={ (Number.isInteger(this.state.addedCards)) ? this.state.addedCards : "..." }
                    playedMinutes={ (Number.isInteger(this.state.playedMinutes)) ? this.state.playedMinutes : "..." }
                />
                <Desks
                    desks={ this.state.desks }
                    isLoading={ this.state.desks === false }
                    pushLink={ this.props.history.push }
                />
            </div>
        );
    }
}

export default Hero;