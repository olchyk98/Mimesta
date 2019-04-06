import React, { Component } from 'react';

import { Provider } from 'react-redux';
import rstore from './rstore';

import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

// Pages
import Dashboard from './pages/dashboard';
import Authentication from './pages/authentication';
import DeskP from './pages/deskpage';

// Stuff
import Nav from './pages/__forall__/nav';
import links from './links';
import { cookieControl } from './utils';
import { TransitionGroup, CSSTransition } from "react-transition-group";

// ...
const PrivateRoute = ({ path, condition, component: Component, redirect: Redirect, ...settings }) => (
	<Route
		path={ path }
		{ ...settings }
		render={ props => (condition) ? <Component { ...props } /> : <Redirect { ...props } to={ Redirect } /> }
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
                            <Route
                                render={({ location }) => (
                                    <TransitionGroup>
                                        <CSSTransition
                                            key={ location.key }
                                            timeout={{ enter: 300, exit: 300 }}
                                            classNames={ '__router-fade' }>
                                            <Switch>
                                                <PrivateRoute
                                                    path={ links["DASHBOARD_PAGE"].route }
                                                    condition={ !!this.clientID }
                                                    component={ Dashboard }
                                                    redirect={ Authentication }
                                                    exact
                                                />
                                                <PrivateRoute
                                                    path={ links["DESK_PAGE"].route }
                                                    condition={ !!this.clientID }
                                                    component={ DeskP }
                                                    redirect={ Authentication }
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
                                        </CSSTransition>
                                    </TransitionGroup>
                                )}
                            />
                    </>
                </BrowserRouter>
            </Provider>
        );
    }
}

export default App;