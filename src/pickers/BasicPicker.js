import React from 'react'
import { css, injectGlobal } from 'emotion'
import { ColorExtractor } from 'react-color-extractor'
import generateColors from 'randomcolor'
import PropTypes from 'prop-types'
import { TinyColor } from '@ctrl/tinycolor'
import Values from 'values.js'

import ColorInput from '../components/ColorInputField'
import ColorBlock from '../components/ColorBlock'
import ActiveColor from '../components/ActiveColor'
import Container from '../components/Container'
import Swatches from '../components/Swatches'
import ImagePicker from '../components/ImagePicker'
import PaletteGenerator from '../components/PaletteGenerator'

const DEFAULT_SWATCHES = ['#5a80b4', '#40e0d0', '#088da5', '#f6546a', '#cac8a0', '#0079cf']

const DEFAULT_COLOR = '#088da5'

const MAX_COLORS = 64

injectGlobal`body{ background: mistyrose; }`

/**
 * Basic Color Picker - Similar to <BlockPicker /> from react-color but it has image color extractor and palette generator.
 *
 * API
 * 
 * <BasicPicker
 * 	color={DEFAULT_COLOR_IN_COLOR_BLOCK} // Color to show in colorblock pane and input field
 * 	swatches={ARRAY_OF_SWATCHES} // array of swatches to show in the color picker
 * 	onChange={} // Update the color
 * 	onSwatchHover={} // Update the color when hover over the swatches
 * />
 */

export class BasicPicker extends React.Component {
	imageIcon = null
	uploadElement = null

	state = {
		color: new TinyColor(this.props.color),
		swatches: this.props.swatches,
		image: null,
		shades: [],
		tints: [],
		showShades: false,
		showTints: false,
		currentFormat: 'HSL',
		formats: ['HSL', 'HSV', 'RGB', 'HEX'],
	}

	static defaultProps = {
		color: DEFAULT_COLOR,
		swatches: DEFAULT_SWATCHES,
		maxColors: MAX_COLORS,
		triangle: true,
		width: '170px',
	}

	componentDidMount() {
		this.uploadElement = document.getElementById('uploader')
		this.imageIcon = document.getElementById('image-icon')

		this.imageIcon.addEventListener('click', this.simulateClick)
		document.addEventListener('keydown', this.updateKey)
	}

	componentDidUpdate(oldProps) {
		if (oldProps.color !== this.props.color) {
			const color = new TinyColor(this.props.color)

			if (color.isValid) {
				this.setState({ color })
			}
		}

		if (oldProps.swatches !== this.props.swatches) {
			this.setState({ swatches })
		}
	}

	componentWillUnmount() {
		this.imageIcon.removeEventListener('click', this.simulateClick)
		document.removeEventListener('keydown', this.updateKey)
	}

	renderFormats = () => {
		const { formats } = this.state

		return formats.map((format, key) => {
			return (
				<option value={format} key={key}>
					{format}
				</option>
			)
		})
	}

	updateKey = e => {
		if (e.which === 8) {
			this.setState({ image: null, showShades: false, showTints: false })
		}
	}

	simulateClick = e => {
		if (this.uploadElement) {
			this.uploadElement.click()
		}

		e.preventDefault()
	}

	generateSwatches = e => {
		let i = 0
		// Each swatch should be different
		const newColors = new Set()

		while (i < 10) {
			newColors.add(generateColors())
			i++
		}

		this.setState({ swatches: [...newColors], showShades: false, showTints: false })
	}

	uploadImage = e => {
		this.setState({ image: window.URL.createObjectURL(e.target.files[0]) })
	}

	updateSwatch = color => {
		if (this.props.onChange) {
			this.props.onChange(color)
		} else {
			this.setState({ color: new TinyColor(color), showShades: false, showTints: false })
		}
	}

	updateSwatches = swatches =>
		this.setState({ swatches: [...swatches], color: new TinyColor(swatches[0]), showShades: false, showTints: false })

	generateShades = e => {
		const color = new Values(this.state.color.toHexString())
		const shades = []

		color.shades().forEach(shade => shades.push(shade.hexString()))

		this.setState({ shades: [...shades], showShades: true, showTints: false })
	}

	generateTints = e => {
		const color = new Values(this.state.color.toHexString())
		const tints = []

		color.tints().forEach(tint => tints.push(tint.hexString()))

		this.setState({ tints: [...tints], showShades: false, showTints: true })
	}

	render() {
		const { image, color, swatches, shades, showShades, showTints, tints } = this.state
		const styles = {
			triangle: {
				width: '0px',
				height: '0px',
				borderStyle: 'solid',
				borderWidth: '0 10px 10px 10px',
				borderColor: `transparent transparent ${color.toHexString()} transparent`,
				position: 'absolute',
				top: '-10px',
				left: '50%',
				marginLeft: '-10px',
			},
		}

		return (
			<Container width={this.props.width}>
				{this.props.triangle && <div style={styles.triangle} />}
				<ColorBlock color={color}>
					<ActiveColor color={color} />
				</ColorBlock>
				{image && <ColorExtractor maxColors={this.props.maxColors} src={image} getColors={this.updateSwatches} />}
				<div style={{ padding: 10 }}>
					{showShades ? (
						<Swatches
							swatches={shades}
							updateSwatch={this.updateSwatch}
							onSwatchHover={this.props.onSwatchHover && this.updateSwatch}
						/>
					) : showTints ? (
						<Swatches
							swatches={tints}
							updateSwatch={this.updateSwatch}
							onSwatchHover={this.props.onSwatchHover && this.updateSwatch}
						/>
					) : (
						<Swatches
							swatches={swatches}
							updateSwatch={this.updateSwatch}
							onSwatchHover={this.props.onSwatchHover && this.updateSwatch}
						/>
					)}
					<ColorInput value={color.toHexString()} onChange={this.props.onChange} />
					<div
						className={css`
							margin-top: 20px;
							display: flex;
							justify-content: center;
							cursor: pointer;
						`}
					>
						<ImagePicker uploadImage={this.uploadImage} />
						<PaletteGenerator generateSwatches={this.generateSwatches} />
						<span title="tint picker" onClick={this.generateTints}>
							<i id="image-icon" className="fas fa-tint" style={{ marginLeft: 10 }} />
						</span>
						<span title="shade picker" onClick={this.generateShades}>
							<i id="image-icon" className="fas fa-adjust" style={{ marginLeft: 10 }} />
						</span>
						<span
							title="clipboard picker"
							onClick={e => {
								const { currentFormat } = this.state

								const options = {
									HSL: color.toHslString(),
									HEX: color.toHexString(),
									RGB: color.toRgbString(),
									HSV: color.toHsvString(),
								}

								navigator.clipboard.writeText(options[currentFormat])
							}}
						>
							<i id="image-icon" className="fas fa-clipboard" style={{ marginLeft: 10 }} />
						</span>
						<span
							title="reset picker"
							onClick={e => this.setState({ shades: [], tint: [], showShades: false, showTints: false })}
						>
							<i id="image-icon" className="fas fa-arrow-alt-circle-left" style={{ marginLeft: 10 }} />
						</span>
					</div>
					<div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
						<select
							style={{
								border: '0.5px solid rgb(102, 102, 102)',
								backgroundColor: 'smokewhite',
								width: 50,
								color: 'rgb(102, 102, 102)',
							}}
							name="formats"
							onChange={e => this.setState({ currentFormat: e.target.value })}
						>
							{this.renderFormats()}
						</select>
					</div>
				</div>
			</Container>
		)
	}
}
