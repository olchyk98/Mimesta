import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './main.css';

class Hero extends Component {
    render() {
        return(
            <div style={ this.props.style || {} } className="gle-loadicon" />
        );
    }
}

Hero.propTypes = {
    style: PropTypes.object
}

export default Hero;