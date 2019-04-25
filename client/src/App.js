import React, { Component } from 'react';

import { Provider } from 'react-redux';
import rstore from './rstore';

import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

// Pages
import Dashboard from './pages/dashboard';
import Authentication from './pages/authentication';
import DeskP from './pages/deskpage';
import PlayDesk from './pages/playdesk';
import Archive from './pages/archive';
import Statistic from './pages/stats';
import Settings from './pages/settings'

// Stuff
import Nav from './pages/__forall__/nav';
import links from './links';
import { cookieControl } from './utils';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import DialogModal from './pages/__forall__/dialog.modal';

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
                            <DialogModal />
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
                                                <PrivateRoute
                                                    path={ links["PLAY_DESK_PAGE"].route }
                                                    condition={ !!this.clientID }
                                                    component={ PlayDesk }
                                                    redirect={ Authentication }
                                                    exact
                                                />
                                                <PrivateRoute
                                                    path={ links["ARCHIVE_PAGE"].route }
                                                    condition={ !!this.clientID }
                                                    component={ Archive }
                                                    redirect={ Authentication }
                                                    exact
                                                />
                                                <PrivateRoute
                                                    path={ links["STATISTIC_PAGE"].route }
                                                    condition={ !!this.clientID }
                                                    component={ Statistic }
                                                    redirect={ Authentication }
                                                    exact
                                                />
                                                <PrivateRoute
                                                    path={ links["SETTINGS_PAGE"].route }
                                                    condition={ !!this.clientID }
                                                    component={ Settings }
                                                    redirect={ Authentication }
                                                    exact
                                                />
                                                <Route
                                                    path={ links["LOGOUT_PAGE"].route }
                                                    component={() => {
                                                        cookieControl.delete(["userdata"]);
                                                        window.location.href = links["DASHBOARD_PAGE"].absolute;
                                                        return(
                                                            <pre>Processing request....</pre>
                                                        );
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