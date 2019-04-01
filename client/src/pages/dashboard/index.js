import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import { shortNumber } from '../../utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import Desk from '../__forall__/desk';

class StatsCard extends PureComponent {
    render() {
        return(
            <article className="rn-dashboard-stats-item">
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
    value: PropTypes.string.isRequired,
    icon: PropTypes.object.isRequired
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
                                icon: faCube,
                                title: "Learned cards",
                                value: "200"
                            },
                            {
                                icon: faPlus,
                                title: "Added cards",
                                value: "900"
                            },
                            {
                                icon: faClock,
                                title: "Minutes",
                                value: "145"
                            }
                        ].map(({ icon, title, value }, index) => (
                            <StatsCard
                                key={ index }
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