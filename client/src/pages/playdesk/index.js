import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBinoculars, faBomb } from '@fortawesome/free-solid-svg-icons';
import { faSmileBeam, faSurprise, faFlushed, faMehRollingEyes } from '@fortawesome/free-regular-svg-icons';

import { gql } from 'apollo-boost';
import { connect } from 'react-redux';

import client from '../../apollo';
import links from '../../links';

import LoadingIcon from '../__forall__/loadicon';

const QueueItem = () => (
    <button className="rn-playdesk-queue-item definp">
        <span>Something in my life</span>
    </button>
);

class Queue extends PureComponent {
    render() {
        return(
            <section className="rn-playdesk-queue">
                <QueueItem />
                <QueueItem />
                <QueueItem />
                <QueueItem />
                <QueueItem />
            </section>
        );
    }
}

class Display extends Component {
    render() {
        return(
            <section className="rn-playdesk-display">
                <div className="rn-playdesk-display-card">
                    <div className="rn-playdesk-display-card-side front">
                        <h1 className="rn-playdesk-display-card-text">
                            When began the first world war?
                        </h1>
                    </div>
                    <div className="rn-playdesk-display-card-side back"></div>
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
                    ((true) ? ( // visible
                        [
                            {
                                icon: faFlushed,
                                color: "#A5B6FA"
                            },
                            {
                                icon: faSurprise,
                                color: "#DEA5ED"
                            },
                            {
                                icon: faMehRollingEyes,
                                color: "#FBC1D5"
                            },
                            {
                                icon: faSmileBeam,
                                color: "#C0E48E"
                            }
                        ]
                    ) : (
                        [
                            {
                                icon: faBinoculars
                            }
                        ]
                    )).map(({ icon, color }, index) => (
                        <button
                            key={ index }
                            style={{
                                color: color || "black"
                            }}
                            className="rn-playdesk-controls-item definp">
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
            isLoading: true
        }
    }

    componentDidMount() {
        this.loadCards(this.props.match.params.id);
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
                query($deskID: ID!) {
                    getDesk(id: $deskID) {
                        id,
                        cards {
                            
                        }
                    }
                }
            `,
            variables: {
                deskID
            }
        }).then(({ data: { playDesk: a } }) => {
            if(!a) {
                this.props.history.push(links["DASHBOARD_PAGE"].absolute);
                castError();
                return;
            }
        }).catch((err) => {
            this.props.history.push(links["DASHBOARD_PAGE"].absolute);
            castError();
            console.error(err);
        });
    }

    render() {
        return(
            <div className="rn rn-playdesk">
                {
                    (!this.state.isLoading) ? (
                        <>
                            <div className="rn-playdesk-container">
                                <section className="rn-playdesk-progressbar">
                                    <div
                                        style={{
                                            width: 100 - 20 + "%" // 20 - %
                                        }}
                                    />
                                </section>
                                <Queue />
                            </div>
                            <Display />
                            <div className="rn-playdesk-container center">
                                <span className="rn-playdesk-controls_title">Did you know that?</span>
                                <Controls />
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