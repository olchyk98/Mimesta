import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './main.css';

import {
  Sparkline,
  LineSeries,
  PointSeries
} from '@data-ui/sparkline';
import { faBomb } from '@fortawesome/free-solid-svg-icons';

import { constructClassName } from '../../utils';
import links from '../../links';
import client from '../../apollo';

import { connect } from 'react-redux';
import { gql } from 'apollo-boost';

import placeholder from '../__forall__/placeholder.gif';

class Graph extends Component {
	constructor(props) {
		super(props);

		this.state = {
			activeData: {
				index: null,
				tx: null, // %
				ty: null, // %
				value: null
			},
			dims: {
				height: 200,
				width: 0
			}
		}
	}

	getEventArray(arr) {
		// This function helps when sdata array contains
		// only one object (in this case graph won't show anything).

		if(arr.length !== 1) {
			return arr;
		}

		return [
			{ value: 0 },
			...arr
		];
	}

	render() {
		return(
			<section
				className="rn-stats-graph"
				onMouseLeave={ () => this.setState({ activeData: {} }) }
				ref={(ref) => {
					if(!ref) return;

					const a = parseInt(window.getComputedStyle(ref, null)
							  .getPropertyValue('width')),
						  b = this.state.dims.width;

					if(a !== b) {
						this.setState(({ dims: _a }) => ({
							dims: {
								..._a,
								width: a
							}
						}));
					}
				}}>
				<h2 className="rn-stats-graph-title">{ this.props.title }</h2>
				<Sparkline
					ariaLabel="This is a Sparkline of..."
					width={ this.state.dims.width }
					height={ this.state.dims.height }
					data={ this.getEventArray(this.props.sdata).map(io => +io.value) }
					onMouseMove={({ index: a, event: { nativeEvent: { offsetX: b, offsetY: c } }, target: d }) => {
						const val = this.getEventArray(this.props.sdata)[a];

						this.setState(() => ({
							activeData: {
								tx: b / this.state.dims.width * 100,
								ty: c / this.state.dims.height * 100,
								index: a,
								value: `${ val.value }${ (val.date) ? `(${ val.date })` : "" }`
							}
						}));
					}}>
					<LineSeries
						curve="linear"
						stroke="#4dadf7"
					/>
					<PointSeries
						points={[ (Number.isInteger(this.state.activeData.index)) ? this.state.activeData.index : null ]}
						fill="#228ae6"
						stroke="white"
						renderLabel={ () => null }
					/>
				</Sparkline>
				<span
					className={constructClassName({
						"rn-stats-graph-tooltip": true,
						"visible": Number.isInteger(this.state.activeData.index)
					})}
					style={{
						left: this.state.activeData.tx + "%",
						top: this.state.activeData.ty + "%"
					}}>
					{ this.state.activeData.value }
				</span>
			</section>
		);
	}
}

Graph.propTypes = {
	title: PropTypes.string.isRequired,
	sdata: PropTypes.array.isRequired
}

class Hero extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			statsData: null
		}

		this.resizeFunc = () => {
			this.forceUpdate();
		}
	}

	componentDidMount() {
		window.addEventListener('resize', this.resizeFunc);
		this.loadData();
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.resizeFunc);
	}

	loadData = () => {
		const castError = () => {
			this.props.goDialog({
	            iconStyle: "error",
	            icon: faBomb,
	            text: "Something went wrong. Please, try to access your stats a little bit later.",
	            buttons: [
	                {
	                    text: "Close",
	                    onClick: () => null // modal closes automatically
	                }
	            ]
	        });
			this.props.history.push(links["DASHBOARD_PAGE"].absolute);
		}

		client.query({
			query: gql`
				query {
					user {
						id,
						addedCardsStat {
							date,
							value
						},
						gamesPlayedStat {
							date,
							value
						},
						createdDesksStat {
							date,
							value
						}
					}
				}

			`
		}).then(({ data: { user: a } }) => {
			if(!a) return castError();

			this.setState(() => ({
				statsData: {
					addedCards: a.addedCardsStat,
					gamesPlayed: a.gamesPlayedStat,
					createdDesks: a.createdDesksStat
				},
				isLoading: false
			}))
		}).catch((err) => {
			castError();
			console.error(err);
		});
	}

	render() {
		return(
			<div className="rn rn-stats">
				{
					(!this.state.isLoading) ? (
						<>
							<Graph
								title="Added cards"
								sdata={ this.state.statsData.addedCards }
							/>
							<Graph
								title="Games"
								sdata={ this.state.statsData.gamesPlayed }
							/>
							<Graph
								title="Created desks"
								sdata={ this.state.statsData.createdDesks }
							/>
						</>
					) : (
						<>
							<img alt="placeholder" src={ placeholder } className="rn-stats-graph placeholder" />
							<img alt="placeholder" src={ placeholder } className="rn-stats-graph placeholder" />
							<img alt="placeholder" src={ placeholder } className="rn-stats-graph placeholder" />
						</>
					)
				}
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