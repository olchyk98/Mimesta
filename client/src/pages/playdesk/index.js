import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb } from '@fortawesome/free-solid-svg-icons';
import { faEye, faSmileBeam, faSurprise, faFlushed, faMehRollingEyes } from '@fortawesome/free-regular-svg-icons';

import { gql } from 'apollo-boost';
import { connect } from 'react-redux';
import FlipMove from 'react-flip-move';

import client from '../../apollo';
import links from '../../links';
import { constructClassName } from '../../utils';

import LoadingIcon from '../__forall__/loadicon';
class QueueItem extends PureComponent { // react-fli-move doesn't support stateless functional components
    render() {
        return(
            <button className="rn-playdesk-queue-item definp">
                <span>{ this.props.front }</span>
            </button>
        );
    }
}

class Queue extends PureComponent {
    render() {
        return(
            <FlipMove
                typeName="section"
                className="rn-playdesk-queue"
                enterAnimation="elevator"
                leaveAnimation="elevator"
                duration="500">
                {
                    this.props.queue.map(({ id, fronttext, index }) => (
                        <QueueItem
                            key={ index }
                            id={ id }
                            front={ fronttext }
                        />
                    ))
                }
            </FlipMove>
        );
    }
}

class Display extends PureComponent {
    render() {
        return(
            <section className="rn-playdesk-display">
                <div className={constructClassName({
                    "rn-playdesk-display-card": true,
                    "rotated": this.props.rotated
                })}>
                    <div className="rn-playdesk-display-card-side front">
                        <h1 className="rn-playdesk-display-card-text">
                            { this.props.card.fronttext }
                        </h1>
                    </div>
                    <div className="rn-playdesk-display-card-side back">
                        <h1 className="rn-playdesk-display-card-text">
                            { this.props.card.backtext }
                        </h1>
                    </div>
                </div>
            </section>
        );
    }
}

class Controls extends Component {
    render() {
        return(
            <section className="rn-playdesk-controls">
                {
                    ((this.props.showAnswer) ? (
                        [
                            {
                                icon: faFlushed,
                                color: "#A5B6FA",
                                onClick: () => this.props.onRate(1)
                            },
                            {
                                icon: faSurprise,
                                color: "#DEA5ED",
                                onClick: () => this.props.onRate(2)
                            },
                            {
                                icon: faMehRollingEyes,
                                color: "#FBC1D5",
                                onClick: () => this.props.onRate(3)
                            },
                            {
                                icon: faSmileBeam,
                                color: "#C0E48E",
                                onClick: () => this.props.onRate(4)
                            }
                        ]
                    ) : (
                        [
                            {
                                icon: faEye,
                                onClick: this.props.onRotate
                            }
                        ]
                    )).map(({ icon, color, onClick }, index) => (
                        <button
                            key={ index }
                            style={{
                                color: color || "black"
                            }}
                            className="rn-playdesk-controls-item definp"
                            onClick={ onClick }>
                            <FontAwesomeIcon icon={ icon } />
                        </button>
                    ))
                }
            </section>
        );
    }
}

class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            showAnswer: false,
            questions: null,
            queue: null,
            strike: 0,
            deskID: null
        }

        // this.stopwatch could be declared as a state variable,
        // but I think we don't need it + it's worse for performance
        this.tempcIndex =
        this.playSeconds =
        this.losedCards =
        this.maxStrike =
        this.clearCards = 0;
        this.stockwatchINT = null;
    }

    componentDidMount() {
        this.loadCards(this.props.match.params.id);
    }

    setStopwatch = (run = true) => {
        if(run) {
            this.stockwatchINT = setInterval(() => this.playSeconds++, 1e3);
        } else {
            clearInterval(this.stockwatchINT);
            return this.playSeconds;
        }
    }

    getCurrentCard = () => this.state.queue[0];

    loadCards = deskID => {
        if(!this.state.isLoading || this.state.isWinner) this.setState(() => ({
            isLoading: true,
            isWinner: false
        }));

        const castError = () => this.props.goDialog({
            iconStyle: "error",
            icon: faBomb,
            text: "Oops. We couldn't load cards from this desk. Please, try later.",
            buttons: [
                {
                    text: "Close",
                    onClick: () => null // modal closes automatically
                }
            ]
        });

        client.query({
            query: gql`
                query($deskID: ID!, $shuffleLimit: Int) {
                    getDesk(id: $deskID, shuffleLimit: $shuffleLimit) {
                        id,
                        cards {
                            id,
                            fronttext,
                            backtext
                        }
                    }
                }
            `,
            variables: {
                deskID,
                shuffleLimit: 50
            }
        }).then(({ data: { getDesk: a } }) => {
            if(!a) {
                this.props.history.push(links["DASHBOARD_PAGE"].absolute);
                castError();
                return;
            }

            this.setState(() => ({
                isLoading: false,
                questions: a.cards,
                deskID: a.id
            }), this.nextCard);
        }).catch((err) => {
            this.props.history.push(links["DASHBOARD_PAGE"].absolute);
            castError();
            console.error(err);
        });
    }

    nextCard = () => {
        if(!this.state.questions) return;

        if(this.state.queue) {
            this.setState(({ queue: a }) => {
                const b = Array.from(a);
                b.splice(0, 1);
                const c = b[0];

                if(!c) { // desk end |> sq
                    this.endGame();
                    return({
                        isLoading: true
                    });
                }

                return({
                    queue: this.completeQueue(b),
                    showAnswer: false
                });
            });
        } else { // build queue
            this.setStopwatch(false);
            const a = Array.from(this.state.questions).sort(() => Math.random() - .5);

            this.setState(() => ({
                queue: this.completeQueue(a)
            }), () => this.setStopwatch(true));
        }
    }

    // @ Add index for each element in the array
    // @ :{ Array }
    completeQueue(arr) {
        return arr.map((io, ia) => ({
            ...io,
            index: io.index || ++this.tempcIndex
        }));
    }

    rateCard = rating => {
        if(!this.state.showAnswer) return;

        const infu = (obj, itt) => {
            this.losedCards++;
            if(this.state.strike && this.state.strike > this.maxStrike) this.maxStrike = this.state.strike;
            this.setState(() => ({ strike: 0 }));

            const a = [];

            for(let ma = 0; ma < itt; ma++) {
                a.push({ ...obj, index: ++this.tempcIndex });
            }

            this.setState(({ queue: b }) => ({
                queue: this.completeQueue([
                    ...b,
                    ...a
                ])
            }));
        }

        switch(rating) {
            case 4:
                this.clearCards++;
                this.setState(({ strike: a }) => ({ strike: a + 1 }));
            break; // good // passed
            case 3: // push one
                infu(this.getCurrentCard(), 1);
            break;
            case 2: // push double
                infu(this.getCurrentCard(), 2);
            break;
            case 1: // bad // push triple
                infu(this.getCurrentCard(), 3);
            break;
            default:break;
        }

        this.nextCard();
    }

    endGame = (afterError = false) => {
        // 1. Submit game
        // 2. Show blue winning screen

        client.mutate({
            mutation: gql`
                mutation($deskID: ID!, $seconds: Int! $losedCards: Int!, $clearCards: Int!, $maxStrike: Int!) {
                    playDesk(deskID: $deskID, seconds: $seconds, losedCards: $losedCards, clearCards: $clearCards, maxStrike: $maxStrike)
                }
            `,
            variables: {
                deskID: this.state.deskID,
                seconds: this.playSeconds,
                losedCards: this.losedCards,
                clearCards: this.clearCards,
                maxStrike: this.maxStrike
            }
        }).then(({ data: { playDesk: a } }) => {
            if(!a) return null;
            
            this.setState(() => ({
                isLoading: false,
                isWinner: true
            }));
        }).catch((err) => {
            console.error(err);
            this.props.goDialog({
                iconStyle: "error",
                icon: faBomb,
                text: "Ooooops. We don't know what happened, sorry about that.",
                buttons: [
                    {
                        text: "Close",
                        onClick: () => this.props.history.push(links["DASHBOARD_PAGE"].absolute) // modal closes automatically
                    }
                ]
            });
        })
    }

    render() {
        return(
            <div className="rn rn-playdesk">
                {
                    (!this.state.isLoading && (this.state.queue || this.state.isWinner)) ? (
                        (!this.state.isWinner) ? (
                            <>
                                <div className="rn-playdesk-container">
                                    <section className="rn-playdesk-progressbar">
                                        <div
                                            style={{
                                                width: this.state.queue.length / this.state.questions.length * 100 + '%'
                                            }}
                                        />
                                    </section>
                                    <Queue
                                        queue={ this.state.queue }
                                    />
                                </div>
                                <Display
                                    card={ this.getCurrentCard() }
                                    rotated={ this.state.showAnswer }
                                />
                                <div className="rn-playdesk-container center">
                                    {
                                        (this.state.showAnswer) ? (
                                            <span className="rn-playdesk-controls_title">Did you know that?</span>
                                        ) : null
                                    }
                                    <Controls
                                        showAnswer={ this.state.showAnswer }
                                        onRotate={ () => (!this.state.showAnswer) ? this.setState({ showAnswer: true }) : null }
                                        onRate={ rating => (this.state.showAnswer) ? this.rateCard(rating) : null }
                                    />
                                </div>
                            </>
                        ) : (
                            null
                        )
                    ) : (
                        <LoadingIcon
                            style={{
                                marginLeft: "auto",
                                marginRight: "auto"
                            }}
                        />
                    )
                }
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