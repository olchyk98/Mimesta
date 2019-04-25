import React, { Component } from 'react';
import './main.css';

const image = "http://sf.co.ua/14/05/wallpaper-1533661.jpg";

class Hero extends Component {
	render() {
		return(
			<div className="rn rn-settings">
				<div className="rn-settings-container">
					<section className="rn-settings-account">
						<div className="rn-settings-account-avatar">
							<img alt="user" src={ image } />
						</div>
						<div className="rn-settings-account-info">
							<span className="rn-settings-account-info-name">Sara Tancredi</span>
							<span className="rn-settings-account-info-city">New York, USA</span>
						</div>
					</section>
					<section className="rn-settings-fields"></section>
					{/* <button className="rn-settings-submit definp">Save Changes</button> */}
				</div>
			</div>
		);
	}
}

export default Hero;