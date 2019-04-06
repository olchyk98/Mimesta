import React, { Component, PureComponent } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

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
                                    <td>{ updatedtime }</td>
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

        this.state = {
            card: null
        }
    }

    render() {
        return(
            <>
                <div className={constructClassName({
                    "rn-desk-addcardmod_bg": true,
                    "active": this.props.visible
                })} />
                <div className="rn-desk-addcardmod">
                    <div className="rn-desk-addcardmod-controls">
                        <button className="rn-desk-addcardmod-controls definp">
                            <FontAwesomeIcon icon={} />
                        </button>
                    </div>
                    <div className="rn-desk-addcardmod-card">
                        <div className="rn-desk-addcardmod-card-side front">
                            <h1
                                suppressContentEditableWarning={ true }
                                contentEditable={ true }
                                placeholder="Start typing..."
                                className="definp rn-desk-addcardmod-card-target"
                            ></h1>
                        </div>
                        <div className="rn-desk-addcardmod-card-side back">
                            <h1
                                suppressContentEditableWarning={ true }
                                contentEditable={ true }
                                placeholder="Start typing..."
                                className="definp rn-desk-addcardmod-card-target"
                            ></h1>
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
            addingCard: false
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
    
    render() {
        return(
            <>
                <AddCardModal
                    visible={ true || this.state.addingCard } // DEBUG
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