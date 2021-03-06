import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import { gql } from 'apollo-boost';

import { constructClassName, cookieControl } from '../../utils';
import client from '../../apollo';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faAt, faSignature } from '@fortawesome/free-solid-svg-icons';

class FormsInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inputInFocus: false,
            inputIsnEmpty: false // isn't empty
        }
    }

    static defaultProps = {
        required: false
    }

    render() {
        return(
            <div className="rn-authentication-forms-input">
                <div className="forms-target">
                    <label className={constructClassName({
                        "forms-target_placeholder": true,
                        "inmove": this.state.inputInFocus || this.state.inputIsnEmpty
                    })}>{ this.props.placeholder }</label>
                    <input
                        type={ this.props.type }
                        className="definp"
                        onChange={({ target: { value: a } }) => {
                            this.setState({ inputIsnEmpty: !!a }, () => this.props.onChange(a));
                        }}
                        onFocus={ () => this.setState({ inputInFocus: true }) }
                        onBlur={ () => this.setState({ inputInFocus: false }) }
                        required={ this.props.required }
                    />
                    <div className="forms-target-icon">
                        <FontAwesomeIcon icon={ this.props.icon } />
                    </div>
                </div>
                <div className={constructClassName({
                    "forms-target_underline": true,
                    "infocus": this.state.inputInFocus,
                    "success": this.props.isSuccess,
                    "error": this.props.isError,
                    "loading": this.props.isLoading
                })} />
            </div>
        );
    }
}

FormsInput.propTypes = {
    icon: PropTypes.object.isRequired,
    placeholder: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    required: PropTypes.bool,
    isSuccess: PropTypes.bool,
    isError: PropTypes.bool,
    isLoading: PropTypes.bool,
    onChange: PropTypes.func.isRequired
}

class LoginForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loginInProcess: false,
            isSuccess: false,
            isError: false
        }

        this.data = {
            email: null,
            password: null
        }
    }

    doLogin = () => {
        const { email, password } = this.data,
              strec = a => !!a && !!a.replace(/\s|\n/g, "").length;
        
        if(this.state.loginInProcess || !strec(email) || !strec(password)) return;

        this.setState(() => ({
            loginInProcess: true,
            isError: false,
            isSuccess: false
        }));

        client.mutate({
            mutation: gql`
                mutation($email: String!, $password: String!) {
                    loginUser(email: $email, password: $password) {
                        id,
                        name
                    }
                }
            `,
            variables: {
                email, password
            }
        }).then(({ data: { loginUser: a } }) => {
            this.setState(() => ({
                loginInProcess: false
            }));

            if(!a) {
                this.setState(() => ({
                    isError: true
                }));
                return;
            }

            this.setState(() => ({
                isSuccess: true
            }));

            cookieControl.set("userdata", JSON.stringify({
                id: a.id,
                name: a.name
            }));

            window.location.reload();
        });
    }

    render() {
        return(
            <form className="rn-authentication-forms-item" onSubmit={ e => { e.preventDefault(); this.doLogin(); } }>
                <h1 className="rn-authentication-forms-title">Welcome back!</h1>
                <FormsInput
                    icon={ faAt }
                    placeholder="Email"
                    type="text"
                    required={ true }
                    isError={ this.state.isError }
                    isSuccess={ this.state.isSuccess }
                    isLoading={ this.state.loginInProcess }
                    onChange={ a => this.data.email = a }
                />
                <FormsInput
                    icon={ faLock }
                    placeholder="Password"
                    type="password"
                    required={ true }
                    isError={ this.state.isError }
                    isSuccess={ this.state.isSuccess }
                    isLoading={ this.state.loginInProcess }
                    onChange={ a => this.data.password = a }
                />
                <button
                    type="submit"
                    disabled={ this.state.loginInProcess }
                    className={constructClassName({
                    "rn-authentication-forms-sbtn submit definp": true,
                    "inlogin": this.state.loginInProcess
                })}>Log in</button>
                <p className="rn-authentication-forms-stagetrans">Need a Mimesta account? <button type="button" onClick={ () => this.props.moveStage("REGISTER_STAGE") } className="link definp">Create an account</button></p>
            </form>
        );
    }
}

class RegisterForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isError: false,
            isSuccess: false,
            registerInProcess: false,
            isEmailError: false
        }

        this.data = {
            name: null,
            email: null,
            password: null
        }
    }

    doRegister = () => {
        const { email, password, name } = this.data,
              strec = a => !!a && !!a.replace(/\s|\n/g, "").length;
        
        if(this.state.registerInProcess || !strec(email) || !strec(password) || !strec(name)) return;

        this.setState(() => ({
            registerInProcess: true,
            isError: false,
            isSuccess: false,
            isEmailError: false
        }));

        client.mutate({
            mutation: gql`
                mutation($name: String!, $email: String!, $password: String!) {
                    registerUser(name: $name, email: $email, password: $password) {
                        id,
                        name
                    }
                }
            `,
            variables: { email, password, name }
        }).then(({ data: { registerUser: a } }) => {
            this.setState(() => ({
                registerInProcess: false
            }));

            if(!a) {
                this.setState(() => ({
                    isError: true,
                    isEmailError: true
                }));
                return;
            }

            this.setState(() => ({
                isSuccess: true
            }));

            cookieControl.set("userdata", JSON.stringify({
                id: a.id,
                name: a.name
            }));

            window.location.reload();
        }).catch((err) => {
            console.error(err);
            this.setState(() => ({
                isEmailError: false,
                isError: false
            }));
        });
    }

    render() {
        return(
            <form className="rn-authentication-forms-item" onSubmit={ e => { e.preventDefault(); this.doRegister(); } }>
                <h1 className="rn-authentication-forms-title">Register to continue</h1>
                <FormsInput
                    icon={ faSignature }
                    placeholder="Name"
                    type="text"
                    required={ true }
                    isError={ this.state.isError && !this.state.isEmailError }
                    isSuccess={ this.state.isSuccess }
                    isLoading={ this.state.registerInProcess }
                    onChange={ a => this.data.name = a }
                />
                <FormsInput
                    icon={ faAt }
                    placeholder="Email"
                    type="text"
                    required={ true }
                    isError={ this.state.isError }
                    isSuccess={ this.state.isSuccess }
                    isLoading={ this.state.registerInProcess }
                    onChange={ a => this.data.email = a }
                />
                <FormsInput
                    icon={ faLock }
                    placeholder="Password"
                    type="password"
                    required={ true }
                    isError={ this.state.isError && !this.state.isEmailError }
                    isSuccess={ this.state.isSuccess }
                    isLoading={ this.state.registerInProcess }
                    onChange={ a => this.data.password = a }
                />
                <button
                    type="submit"
                    disabled={ this.state.registerInProcess }
                    className={constructClassName({
                    "rn-authentication-forms-sbtn submit definp": true,
                    "inlogin": this.state.registerInProcess
                })}>Register</button>
                <p className="rn-authentication-forms-stagetrans">Already have a Mimesta account? <button type="button" onClick={ () => this.props.moveStage("LOGIN_STAGE") } className="link definp">Log in</button></p>
            </form>
        );
    }
}

class Forms extends Component {
    constructor(props) {
        super(props);

        this.state = {
            stage: "LOGIN_STAGE" // LOGIN_STAGE, REGISTER_STAGE
        }
    }

    moveStage = stage => this.setState({ stage });
    
    render() {
        const C = {
            "LOGIN_STAGE": LoginForm,
            "REGISTER_STAGE": RegisterForm
        }[this.state.stage];

        return(
            <div className="rn-authentication-part rn-authentication-forms">
                {
                    (C) ? <C
                        moveStage={ this.moveStage }
                    /> : null
                }
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