import React, { Component } from 'react';
import './main.css';

import { constructClassName } from '../../utils';

class FormsInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inputInFocus: false,
            inputIsnEmpty: false // isn't empty
        }
    }

    render() {
        return(
            <div className="rn-authentication-forms-input">
                <div className="forms-target">
                    <label className={constructClassName({
                        "forms-target_placeholder": true,
                        "inmove": this.state.inputInFocus || this.state.inputIsnEmpty
                    })}>Login</label>
                    <input
                        type="text"
                        className="definp"
                        onChange={ ({ target: { value: a } }) => this.setState({ inputIsnEmpty: !!a }) }
                        onFocus={ () => this.setState({ inputInFocus: true }) }
                        onBlur={ () => this.setState({ inputInFocus: false }) }
                    />
                    <div className="forms-target-icon"></div>
                </div>
                <div className="forms-target_underline" />
            </div>
        );
    }
}

class LoginForm extends Component {
    render() {
        return(
            <div className="rn-authentication-forms-item">
                <h1 className="rn-authentication-forms-title">Log in to your account</h1>
                <FormsInput />
            </div>
        );
    }
}

class Forms extends Component {
    render() {
        return(
            <div className="rn-authentication-part rn-authentication-forms">
                <LoginForm />
            </div>
        );
    }
}

class Scene extends Component {
    render() {
        return(
            <div className="rn-authentication-part rn-authentication-scene">

            </div>
        );
    }
}

class Hero extends Component {
    constructor(props) {
        super(props);

        this.state = {
            
        }
    }

    render() {
        return(
            <div className="rn nonav rn-authentication">
                <Forms />
                <Scene />
            </div>
        );
    }
}

export default Hero;