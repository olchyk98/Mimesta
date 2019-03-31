import React, { Component } from 'react';
import './main.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

import Desk from '../__forall__/desk';

class StatsCard extends Component {
    render() {
        return(
            <article className="rn-dashboard-stats-item">
                <div className="rn-dashboard-stats-item-icon">
                    <FontAwesomeIcon icon={ faBox } />
                </div>
                <h3 className="rn-dashboard-stats-item-value">2.3k</h3>
                <span className="rn-dashboard-stats-item-title">Total</span>
            </article>
        );
    }
}

class Stats extends Component {
    render() {
        return(
            <>
                <h2 className="rn-dashboard-toptitle">Analytics Overview for this month</h2>
                <section className="rn-dashboard-section rn-dashboard-stats">
                    <StatsCard />
                    <StatsCard />
                    <StatsCard />
                </section>
            </>
        );
    }
}

class Desks extends Component {
    render() {
        return(
            <>
                <h2 className="rn-dashboard-toptitle">Analytics Overview for this month</h2>
                <section className="rn-dashboard-section rn-dashboard-desks">
                    <Desk />
                    <Desk />
                    <Desk />
                    <Desk />
                    <Desk />
                    <Desk />
                    <Desk />
                </section>
            </>
        );
    }
}

class Hero extends Component {
    render() {
        return(
            <div className="rn rn-dashboard">
                <Stats />
                <Desks />
            </div>
        );
    }
}

export default Hero;