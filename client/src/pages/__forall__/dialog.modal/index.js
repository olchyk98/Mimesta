import React, { Component } from 'react';
import './main.css';

import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { constructClassName } from '../../../utils';

class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showData: null
        }
    }

    componentDidUpdate(pprops) {
        if(
            (!pprops.toShow && this.props.toShow) ||
            (
                pprops.toShow && this.state.showData &&
                JSON.stringify(pprops.toShow) !== JSON.stringify(this.state.showData) // XXX
            )
        ) { // new data
            this.setState(() => ({
                showData: this.props.toShow
            }));
        }
    }
    
    render() {
        const showData = this.state.showData;

        return(
            <>
                <div onClick={ this.props.closeSelf } className={constructClassName({
                    "gle-dialogmod_bg": true,
                    "active": !!this.props.toShow
                })} />
                <div className="gle-dialogmod">
                    <div className={constructClassName({
                        "gle-dialogmod-icon": true,
                        [showData && showData.iconStyle]: (
                            showData && showData.iconStyle
                        )
                    })}>
                        { showData && <FontAwesomeIcon icon={ showData.icon } /> }
                    </div>
                    <h2 className="gle-dialogmod-title">
                        { showData && showData.text }
                    </h2>
                    <div className="gle-dialogmod-icon-controls">
                        {
                            (showData) ? (
                                showData.buttons.map(({ color, text, onClick }, index) => (
                                    <button
                                        key={ index }
                                        onClick={() => {
                                            onClick();
                                            this.props.closeSelf();
                                        }}
                                        className={constructClassName({
                                            "gle-dialogmod-icon-controls-item definp": true,
                                            [color]: !!color
                                        })}>
                                        { text }
                                    </button>
                                ))
                            ) : null
                        }
                    </div>
                </div>
            </>
        );
    }
}

const mapStateToProps = ({ dialogModal }) => ({
    toShow: dialogModal
});

const mapActionsToProps = {
    closeSelf: () => ({ type: 'SHOW_DIALOG_MODAL', payload: null })
}

export default connect(
    mapStateToProps,
    mapActionsToProps
)(Hero);