import React, { Component } from 'react';
import './main.css';

import { Provider } from 'react-redux';
import rstore from './rstore';

import { Switch, Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

const NeedleRoute = ({ path, condition, component: Component, redirect: Redirect, ...settings }) => (
	<Route
		path={ path }
		{ ...settings }
		component={ props => (condition) ? <Component { ...props } /> : <Redirect { ...props } to={ Redirect } /> }
	/>
);


class App extends Component {
    render() {
        return(
            <Provider store={ rstore }>
                <BrowserRouter>
                    <>
                        <Switch>
                            <NeedleRoute
                                path={ '/' }
                                condition={ true }
                                component={ () => null) }
                                redirect={ () => null }
                                exact
                            />
                        </Switch>
                    </>
                </BrowserRouter>
            </Provider>
        );
    }
}