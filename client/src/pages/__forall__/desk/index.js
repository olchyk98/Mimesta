import React, { Component, PureComponent } from 'react';
import './main.css';

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
            <article className="gle-pack">
                {
                    (() => {
                        let a = 3,
                            b = [
                                <Layer key={ 0 } style={{ "zIndex": a }}>
                                    <h4 className="gle-pack-layer-title">Hell</h4>
                                    <span className="gle-pack-layer-desc">274 cards</span>
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

export default Hero;