import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBinoculars, faBomb } from '@fortawesome/free-solid-svg-icons';
import { faSmileBeam, faSurprise, faFlushed, faMehRollingEyes } from '@fortawesome/free-regular-svg-icons';

import { gql } from 'apollo-boost';
import { connect } from 'react-redux';

import client from '../../apollo';
import links from '../../links';
import { constructClassName } from '../../utils';

import LoadingIcon from '../__forall__/loadicon';

const QueueItem = ({ id, front }) => (
    <button className="rn-playdesk-queue-item definp">
        <span>{ front }</span>
    </button>
);

class Queue extends PureComponent {
    render() {
        return(
            <section className="rn-playdesk-queue">
                {
                    this.props.queue.map(({ id, fronttext }) => (
                        <QueueItem
                            key={ id }
                            id={ id }
                            front={ fronttext }
                        />
                    ))
                }
            </section>
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
                                icon: faBinoculars,
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
            currentCard: null
        }
    }

    componentDidMount() {
        this.loadCards(this.props.match.params.id);
    }

    getCurrentCard = () => {
        const a = this.state.queue,
              b = this.state.currentCard;
        return (a && b) ? a.find(({ id }) => id === b) : null;
    }

    loadCards = deskID => {
        if(!this.state.isLoading) this.setState(() => ({ isLoading: true }));

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
                questions: a.cards
            }), this.nextCard);
        }).catch((err) => {
            this.props.history.push(links["DASHBOARD_PAGE"].absolute);
            castError();
            console.error(err);
        });
    }

    nextCard = () => {
        if(!this.state.questions) return;

        if(this.state.queue && this.state.currentCard) {
            this.setState(({ queue: a }) => {
                const b = a.filter(io => io.id !== this.state.currentCard),
                      c = b[0].id;

                if(!c) { // desk end |> sq
                    this.endGame();
                    return({
                        isLoading: true
                    });
                }

                return({
                    queue: b,
                    currentCard: c,
                    showAnswer: false
                });
            });
        } else { // build queue
            const a = Array.from(this.state.questions).sort(() => Math.random() - 0.5);

            this.setState(() => ({
                queue: a,
                currentCard: a[0].id
            }));
        }
    }

    rateCard = rating => {
        if(!this.state.showAnswer || !this.state.currentCard) return;

        const infu = (obj, itt) => {
            const a = [];

            for(let ma = 0; ma < itt; ma++) {
                a.push(Object.assign({}, obj));
            }

            this.setState(({ queue: b }) => ({
                queue: [
                    ...b,
                    ...a
                ]
            }));
        }

        switch(rating) {
            case 4:break; // good // passed
            case 3: // push one
                infu(this.getCurrentCard());
            break;
            case 2: // push double
                infu(this.getCurrentCard());
            break;
            case 1: // bad // push triple
                infu(this.getCurrentCard());
            break;
        }

        this.nextCard();
    }

    endGame = () => {
        alert("GAME END");
    }

    render() {
        return(
            <div className="rn rn-playdesk">
                {
                    (!this.state.isLoading && this.state.queue) ? (
                        <>
                            <div className="rn-playdesk-container">
                                <section className="rn-playdesk-progressbar">
                                    <div
                                        style={{
                                            width: 100 - 20 + "%" // 20 - %
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