import React, { Component } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

import Desk from '../__forall__/desk';

class StatsCard extends Component {
    render() {
        return(
            <article className="rn-dashboard-stats-item">
                <div>
                    <FontAwesomeIcon icon={ faBox } />
                </div>
                <h3>2.3k learned cards</h3>
                <span>Total</span>
            </article>
        );
    }
}

class Stats extends Component {
    render() {
        return(
            <section className="rn-dashboard-section rn-dashboard-stats">
                <h2 className="rn-dashboard-toptitle">Analytics Overview for this month</h2>
                <StatsCard />
                <StatsCard />
                <StatsCard />
            </section>
        );
    }
}

class Hero extends Component {
    render() {
        return(
            <div className="rn rn-dashboard">
                <Stats />
            </div>
        );
    }
}

export default Hero;