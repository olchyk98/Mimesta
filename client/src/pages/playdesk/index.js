import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
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

        this.initialState = {
            isLoading: true,
            showAnswer: false,
            questions: null,
            queue: null,
            strike: 0,
            deskID: null,
            totalCards: null,
            isWinner: false,
            losedCards: 0,
            maxStrike: 0,
            clearCards: 0
        }

        this.state = Object.assign({}, this.initialState);

        // more variables |=> this.resetVariables

        this.requestedID = this.props.match.params.id;
    }

    resetVariables = () => {
        this.setState(() => this.initialState);
        this.tempcIndex =
        this.playSeconds =
        this.stockwatchINT = null;
    }

    componentDidMount() {
        this.loadCards(this.requestedID);
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
        this.resetVariables();
        this.setState(() => ({
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
                deskID: a.id,
                totalCards: a.cards.length
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
            const b = Array.from(this.state.queue);
                  b.splice(0, 1);
                  const c = b[0];
  
            if(!c) { // desk end |> sq
                this.endGame();
                this.setState(() => ({
                    isLoading: true
                }));
            }

            this.setState(() => ({
                queue: this.completeQueue(b),
                showAnswer: false
            }));
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

    updateMaxStrike = () => {
        if(this.state.strike && this.state.strike > this.state.maxStrike) {
            this.setState(({ strike }) => ({
                maxStrike: strike
            }));
        }
    }

    rateCard = rating => {
        if(!this.state.showAnswer) return;

        const infu = (obj, itt) => {
            this.setState(({ losedCards: a }) => ({ losedCards: a + 1 }));
            this.updateMaxStrike();
            this.setState(() => ({ strike: 0 }));

            const a = [];

            for(let ma = 0; ma < itt; ma++) {
                a.push({ ...obj, index: ++this.tempcIndex });
            }

            this.setState(({ queue: b, totalCards: c }) => ({
                queue: [
                    ...this.state.queue,
                    ...a
                ],
                totalCards: c + itt
            }), this.nextCard);
        }

        switch(rating) {
            case 4:
                this.setState(({ strike: a, clearCards: b }) => ({
                    strike: a + 1, clearCards: b + 1
                }));
                this.nextCard();
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
    }

    endGame = (afterError = false) => {
        this.updateMaxStrike();
        
        client.mutate({
            mutation: gql`
                mutation($deskID: ID!, $seconds: Int! $losedCards: Int!, $clearCards: Int!, $maxStrike: Int!) {
                    playDesk(deskID: $deskID, seconds: $seconds, losedCards: $losedCards, clearCards: $clearCards, maxStrike: $maxStrike) {
                        id
                    }
                }
            `,
            variables: {
                deskID: this.state.deskID,
                seconds: this.playSeconds,
                losedCards: this.state.losedCards,
                clearCards: this.state.clearCards,
                maxStrike: this.state.maxStrike
            }
        }).then(({ data: { playDesk: a } }) => {
            console.log(a);
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
                                                width: this.state.queue.length / this.state.totalCards * 100 + '%'
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
                            <div className="rn-playdesk-windisplay">
                                <div className="rn-playdesk-windisplay-icon">
                                    <FontAwesomeIcon icon={ faBirthdayCake } />
                                </div>
                                <h2 className="rn-playdesk-windisplay-text">Good job!</h2>
                                <div className="rn-playdesk-windisplay-stats">
                                    <span><strong>{ this.state.clearCards }</strong> successfully passed cards</span>
                                    <span>•</span>
                                    <span>You didn't know answer <strong>{ this.state.losedCards }</strong> time{ (this.state.losedCards !== 1) ? "s" : "" }</span>
                                    <span>•</span>
                                    <span><strong>{ this.state.maxStrike }</strong> perfectly learned cards in row</span>
                                </div>
                                <button className="rn-playdesk-windisplay-control definp" onClick={ () => this.props.history.push(links["DASHBOARD_PAGE"].absolute) }>Move to dashboard</button>
                                <button className="rn-playdesk-windisplay-control definp" onClick={ () => this.loadCards(this.requestedID) }>Play again</button>
                            </div>
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