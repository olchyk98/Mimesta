import React, { Component } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faUserFriends,
    faCogs,
    faChartPie,
    faBook,
    faDungeon
} from '@fortawesome/free-solid-svg-icons';

const image = "https://assetstorev1-prd-cdn.unity3d.com/key-image/51efc2f8-fcbc-4000-bdb2-d82d5cd1a54f.jpg";

class Hero extends Component {
    render() {
        return(
            <nav className="gle-nav">
                <div className="gle-nav-avatar">
                    <img src={ image } alt="user avatar" />
                </div>
                {
                    [
                        {
                            icon: faBook,
                            url: null,
                            title: "Study"
                        },
                        {
                            icon: faBox,
                            url: null,
                            title: "Archive"
                        },
                        {
                            icon: faUserFriends,
                            url: null,
                            title: "Friends"
                        },
                        {
                            icon: faChartPie,
                            url: null,
                            title: "Statistics"
                        },
                        {
                            icon: faCogs,
                            url: null,
                            title: "Settings"
                        },
                        {
                            icon: faDungeon,
                            url: null,
                            title: "Logout"
                        }
                    ].map(({ icon, title }, index) => (
                        <button
                            key={ index }
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

export default Hero;