import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import { withRouter } from 'react-router';

import links from '../../../links';

class Layer extends PureComponent {
    static defaultProps = {
        style: {}
    }

    render() {
        return(
            <div style={ this.props.style } className="gle-pack-layer">
                { this.props.children }
            </div>
        );
    }
}

class Hero extends Component {
    render() {
        return(
            <article
                className="gle-pack"
                onClick={() => {
                    this.props.history.push(`${ links["DESK_PAGE"].absolute }/${ this.props.id }`);
                }}>
                {
                    (() => {
                        let a = 3,
                            b = [
                                <Layer key={ 0 } style={{ "zIndex": a }}>
                                    <h4 className="gle-pack-layer-title">{ this.props.name }</h4>
                                    <span className="gle-pack-layer-desc">
                                        { `${ this.props.cards } card${ (this.props.cards !== 1) ? "s" : "" }` }
                                    </span>
                                </Layer>
                            ];

                        for(let ma = 1; ma <= a; ma++) b.push(
                            <Layer
                                key={ ma }
                                style={{
                                    "transform": `translateY(${ -5 * ma }px)`,
                                    "zIndex": a - ma
                                }}
                            />
                        );

                        return b;
                    })()
                }
            </article>
        );
    }
}

Hero.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    cards: PropTypes.number.isRequired
}

export default withRouter(Hero);