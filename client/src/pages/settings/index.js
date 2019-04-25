import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import { gql } from 'apollo-boost';
import { connect } from 'react-redux';

import client from '../../apollo';
import api from '../../api';
import { constructClassName } from '../../utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faBomb } from '@fortawesome/free-solid-svg-icons';

import LoadingIcon from '../__forall__/loadicon';

class Input extends PureComponent {
	static defaultProps = {
		type: "text",
		required: false,
		disabled: false
	}

	render() {
		return(
			<div className="rn-settings-input">
				<span className="rn-settings-input-title">{ this.props.title }</span>
				<input
					required={ this.props.required }
					className="definp rn-settings-input-mat definp"
					type={ this.props.type }
					defaultValue={ this.props.defaultValue }
					onChange={ ({ target: { value: a } }) => this.props.onChange(a) }
					disabled={ this.props.disabled }
				/>
			</div>
		);
	}
}

Input.propTypes = {
	title: PropTypes.string.isRequired,
	type: PropTypes.string,
	required: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	disabled: PropTypes.bool
}

class Hero extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			user: null,
			isSubmitting: false,
			updatedUser: {},
			info: null
		}
	}

	componentDidMount() {
		this.loadUser();
	}

	castInfo = (e, t) => this.setState({ info: (t) ? { err: e, text: t } : null });

	loadUser = () => {
		const castError = (err) => {
			console.error(err);
			this.props.goDialog({
		        iconStyle: "error",
		        icon: faBomb,
		        text: "Oops. Something went wrong, please try later",
		        buttons: [
		            {
		                text: "Close",
		                onClick: () => null // modal closes automatically
		            }
		        ]
		    });
		}

		client.query({
			query: gql`
				query {
					user {
						id,
						email,
						name,
						avatar
					}
				}
			`
		}).then(({ data: { user: a } }) => {
			if(!a) return castError();

			this.setState(() => ({
				isLoading: false,
				user: a
			}));
		}).catch(castError);
	}

	submit = () => {
		if(this.state.isLoading || this.state.isSubmitting) return;

		this.setState({ isSubmitting: false });
		this.castInfo(null, null);
		
		const castError = (err) => {
			console.error(err);
			this.props.goDialog({
		        iconStyle: "error",
		        icon: faBomb,
		        text: "We couldn't publish this data. Please, try later.",
		        buttons: [
		            {
		                text: "Close",
		                onClick: () => null // modal closes automatically
		            }
		        ]
		    });
		}

		const { favatar: avatar, name, email, oldpass: oldPassword, newpass: password } = this.state.updatedUser;

		client.mutate({
			mutation: gql`
				mutation($avatar: Upload, $name: String, $email: String, $oldPassword: String, $password: String) {
					changeProfileSettings(avatar: $avatar, name: $name, email: $email, oldPassword: $oldPassword, password: $password) {
						id
					}
				}
			`,
			variables: { avatar, name, email, oldPassword, password }
		}).then(({ data: { changeProfileSettings: a } }) => {
			this.setState({ isSubmitting: false });

			if(!a && (oldPassword || password)) {
				return this.castInfo(true, "Invalid password.");
			} else if(!a) {
				return this.castInfo(true, "Invalid response, please try later.");
			}
			
			this.castInfo(false, "Profile successfully updated!");
		}).catch(castError);
	}

	getUserField = f => (this.state.user) ? this.state.updatedUser[f] || this.state.user[f] : null;
	setUserField = (f, a) => this.setState(({ updatedUser: _a }) => ({ updatedUser: {..._a, [f]: a} }));

	applyAvatar = f => {
		URL.revokeObjectURL(this.state.updatedUser.avatar); // (delete)*(clear cache of) previous avatar preview url
		this.setUserField('avatar', URL.createObjectURL(f)); // create visible avatar preview
		this.setUserField('favatar', f); // save original file
	}

	render() {
		if(this.state.isLoading) return(<LoadingIcon />);

		return(
			<div className="rn rn-settings">
				{/* eslint-disable-next-line */}
				<form className="rn-settings-container" onSubmit={ e => (e.preventDefault(), this.submit()) }>
					<section className="rn-settings-account">
						<div className="rn-settings-account-avatar">
							<img alt="user" src={(() => {
								const a = this.getUserField('avatar');

								if(!this.state.updatedUser.avatar) return api.storage + a;
								else return a;
							})()} />
							<input
								type="file"
								className="hidden"
								accept="image/*"
								disabled={ this.state.isSubmitting }
								id="rn-settings-account-avatar-change"
								onChange={ ({ target: { files: [a] } }) => this.applyAvatar(a) }
							/>
							<label htmlFor="rn-settings-account-avatar-change" type="button" className="rn-settings-account-avatar-change definp">
								<FontAwesomeIcon icon={ faPen } />
							</label>
						</div>
						<div className="rn-settings-account-info">
							<span className="rn-settings-account-info-name">{ this.getUserField('name') }</span>
							<span className="rn-settings-account-info-city">{ this.getUserField('email') }</span>
						</div>
					</section>
					<section className="rn-settings-fields">
						<Input
							title="Name"
							required={ true }
							defaultValue={ this.getUserField('name') }
							onChange={ value => this.setUserField('name', value) }
							disabled={ this.state.isSubmitting }
						/>
						<Input
							title="Email"
							type="email"
							required={ true }
							defaultValue={ this.getUserField('email') }
							onChange={ value => this.setUserField('email', value) }
							disabled={ this.state.isSubmitting }
						/>
						<Input
							title="Old password"
							type="password"
							onChange={ value => this.setUserField('oldpass', value) }
							disabled={ this.state.isSubmitting }
							required={ !!this.state.updatedUser.newpass }
						/>
						<Input
							title="New password"
							type="password"
							onChange={ value => this.setUserField('newpass', value) }
							disabled={ this.state.isSubmitting }
							required={ !!this.state.updatedUser.oldpass }
						/>
					</section>
					{
						(!this.state.info) ? null : (
							<p className={constructClassName({
								"rn-settings-mess": true,
								"err": this.state.info.err
							})}>{ this.state.info.text }</p>
						)	
					}
					<button
						type="submit"
						className="rn-settings-submit definp"
						disabled={ this.state.isSubmitting }>Save Changes</button>
				</form>
			</div>
		);
	}
}

const mapStateToProps = () => ({});

const mapActionsToProps = {
    goDialog: payload => ({ type: 'SHOW_DIALOG_MODAL', payload })
}

export default connect(
    mapStateToProps,
    mapActionsToProps
)(Hero);