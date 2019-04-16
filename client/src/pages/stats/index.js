import React, { Component } from 'react';
import './main.css';

import {
  Sparkline,
  LineSeries,
  PointSeries
} from '@data-ui/sparkline';

import { constructClassName } from '../../utils';

const data = Array(25).fill().map(Math.random);

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
				width: 0,
				left: 0,
				top: 0
			}
		}
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
						  b = this.state.dims.width,
						  { left, top } = ref.getBoundingClientRect();

					if(a !== b) {
						this.setState(({ dims: _a }) => ({
							dims: {
								..._a,
								width: a,
								left, top
							}
						}));
					}
				}}>
				<Sparkline
					ariaLabel="This is a Sparkline of..."
					width={ this.state.dims.width }
					height={ this.state.dims.height }
					data={ data }
					onMouseMove={({ index: a, event: { clientX: b, clientY: c }, target: d }) => {
						const { left, top } = this.state.dims;

						this.setState(() => ({
							activeData: {
								tx: (b - left) / this.state.dims.width * 100,
								ty: (c - top) / this.state.dims.height * 100,
								index: a,
								value: data[a]
							}
						}));
					}}>
					<LineSeries
						curve="linear"
						stroke="#4dadf7"
					/>
					<PointSeries
						points={[ (this.state.activeData.index || null) ]}
						fill="#228ae6"
						stroke="white"
						renderLabel={ () => null }
					/>
				</Sparkline>
				<span
					className={constructClassName({
						"rn-stats-graph-tooltip": true,
						"visible": this.state.activeData.index
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

class Hero extends Component {
	constructor(props) {
		super(props);

		this.resizeFunc = () => {
			this.forceUpdate();
		}
	}

	componentDidMount() {
		window.addEventListener('resize', this.resizeFunc);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.resizeFunc);
	}

	render() {
		return(
			<div className="rn rn-stats">
				<Graph />
			</div>
		);
	}
}

export default Hero;