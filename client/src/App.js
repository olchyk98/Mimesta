import React, { Component } from 'react';

import { Provider } from 'react-redux';
import rstore from './rstore';

import { Switch, Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

// Pages
import Dashboard from './pages/dashboard';
import Authentication from './pages/authentication'

// Stuff
import Nav from './pages/__forall__/nav';
import links from './links';
import { cookieControl } from './utils';

// ...
const NeedleRoute = ({ path, condition, component: Component, redirect: Redirect, ...settings }) => (
	<Route
		path={ path }
		{ ...settings }
		component={ props => (condition) ? <Component { ...props } /> : <Redirect { ...props } to={ Redirect } /> }
	/>
);


class App extends Component {
    constructor(props) {
        super(props);

        this.clientID = cookieControl.get('userdata');
    }

    render() {
        return(
            <Provider store={ rstore }>
                <BrowserRouter>
                    <>
                        {(this.clientID)?<Nav />:null}
                        <Switch>
                            <NeedleRoute
                                path={ links["HOME_PAGE"].absolute }
                                condition={ !!this.clientID }
                                component={ Dashboard }
                                redirect={ Authentication }
                                exact
                            />
                            <NeedleRoute
                                path={ links["AUTH_PAGE"].absolute }
                                condition={ !this.clientID }
                                component={ Authentication }
                                redirect={ Dashboard }
                                exact
                            />
                            <Route
                                path={ links["LOGOUT_PAGE"].route }
                                component={() => {
                                    cookieControl.delete(["userid"])
                                    return null;
                                }}
                                exact
                            />
                        </Switch>
                    </>
                </BrowserRouter>
            </Provider>
        );
    }
}

export default App;