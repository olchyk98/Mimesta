import React, { Component } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faUserFriends,
    faCogs,
    faChartLine,
    faColumns,
    faDungeon
} from '@fortawesome/free-solid-svg-icons';

import { gql } from 'apollo-boost';
import { withRouter } from 'react-router';

import { cookieControl } from '../../../utils';
import client from '../../../apollo';
import api from '../../../api';
import links from '../../../links';

class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            clientData: false
        }
    }

    componentDidMount() {
        this.loadUser();
    }

    loadUser = () => {
        client.query({
            query: gql`
                query {
                    user {
                        id,
                        avatar
                    }
                }
            `
        }).then(({ data: { user: a } }) => {
            if(!a) {
                cookieControl.delete("userdata");
                window.location.reload();
                return;
            }

            this.setState(() => ({
                clientData: a
            }));
        }).catch(console.error);
    }

    render() {
        return(
            <nav className="gle-nav">
                <div className="gle-nav-avatar">
                <img src={ (this.state.clientData && api.storage + this.state.clientData.avatar) || "" } alt="user avatar" />
                </div>
                {
                    [
                        {
                            icon: faColumns,
                            url: null,
                            title: "Dashboard",
                            moveTo: links["DASHBOARD_PAGE"].absolute
                        },
                        {
                            icon: faBox,
                            url: null,
                            title: "Archive",
                            moveTo: '/pd/1'
                        },
                        {
                            icon: faUserFriends,
                            url: null,
                            title: "Friends",
                            moveTo: '/'
                        },
                        {
                            icon: faChartLine,
                            url: null,
                            title: "Statistics",
                            moveTo: '/'
                        },
                        {
                            icon: faCogs,
                            url: null,
                            title: "Settings",
                            moveTo: '/'
                        },
                        {
                            icon: faDungeon,
                            url: null,
                            title: "Logout",
                            moveTo: '/'
                        }
                    ].map(({ icon, title, moveTo }, index) => (
                        <button
                            key={ index }
                            onClick={ () => this.props.history.push(moveTo) }
                            className="gle-nav-item definp btn">
                            <FontAwesomeIcon
                                icon={ icon }
                            />
                            <span className="gle-nav-item-tooltip">{ title }</span>
                        </button>
                    ))
                }
            </nav>
        );
    }
}

export default withRouter(Hero);