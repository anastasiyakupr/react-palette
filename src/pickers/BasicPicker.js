import React from 'react'
import { css, injectGlobal } from 'emotion'
import { ColorExtractor } from 'react-color-extractor'
import generateColors from 'randomcolor'
import { TinyColor } from '@ctrl/tinycolor'
import Values from 'values.js'

import ColorInput from '../components/ColorInputField'
import ColorBlock from '../components/ColorBlock'
import ActiveColor from '../components/ActiveColor'
import Container from '../components/Container'
import Swatches from '../components/Swatches'
import ImagePicker from '../components/ImagePicker'
import PaletteGenerator from '../components/PaletteGenerator'
import Triangle from '../components/Triangle'
import ColorFormatPicker from '../components/ColorFormatPicker'
import TintsGenerator from '../components/TintsGenerator'
import ShadesGenerator from '../components/ShadesGenerator'
import Clipboard from '../components/Clipboard'
import Reset from '../components/Reset'
import Tools from '../components/Tools'

import { Provider } from '../utils/context'

const DEFAULT_SWATCHES = [
  '#5a80b4',
  '#40e0d0',
  '#088da5',
  '#f6546a',
  '#cac8a0',
  '#0079cf',
  '#ffa6ca',
  '#03ec13',
  '#3999dc',
  '#e1c9ec',
  '#2f9d66',
  '#daa520'
]
const DEFAULT_COLOR = '#088da5'
const MAX_COLORS = 64

injectGlobal`
.icon {
	display: inline-block;
	width: 20px;
	position: relative;
	top: 5px;
	left: -5px;
}

.values {
	display: inline-block;
	width: 10px;
	position: relative;
	top: 3px;
	left: 4px;
}

i:not(.icon) {
	cursor: pointer;
}

ul {
	display: grid;
	justify-content: center;
	grid-template-columns: 1fr;
	grid-gap: 15px;
	list-style: none;
	margin-left: -28px;
}
`

/**
 * API usage -
 *
 * <BasicPicker
 * 		color={DEFAULT_COLOR_IN_COLOR_BLOCK_AND_INPUT_FIELD} // Color to show in colorblock pane and input field
 * 		swatches={ARRAY_OF_SWATCHES} // array of swatches to show in the color picker
 * 		onChange={} // Invoked when the color is updated
 * 		onSwatchHover={} // Invoked on hover over the swatches
 * 		maxColors={} // use this prop to control amount of palette generated from the swatches the when an image is uploaded
 * 		theme="dark_or_light"
 * />
 */

export class BasicPicker extends React.PureComponent {
  // Image upload icon
  imageIcon = null
  // Hidden input element for uploading an image
  uploadElement = null

  state = {
    // Current block, active and input field color (or hue)
    color: new TinyColor(this.props.color),
    // Current swatches to be displayed in picker
    swatches: this.props.swatches,
    // Image from which colors are extracted
    image: null,
    // Shades are the hue darkened with black
    shades: [],
    // Tints are the hue lightend with white
    tints: [],
    // Should display the shades swatches
    showShades: false,
    // Should display the tint swatches
    showTints: false,
    // Current color format selected
    currentFormat: 'HEX',
    // Color format options
    formats: ['HSL', 'HSV', 'RGB', 'HEX'],
    lighten: 0,
    brighten: 0,
    darken: 0,
    spin: 0,
    desaturate: 0,
    saturate: 0,
    id: 0
  }

  static defaultProps = {
    color: DEFAULT_COLOR,
    swatches: DEFAULT_SWATCHES,
    maxColors: MAX_COLORS,
    triangle: true,
    width: '220px',
    theme: 'light',
    showTools: false
  }

  // Color conversion helpers. Exposing these as static methods is more convenient and keeps the component API minimal
  static toRGB = color => new TinyColor(color).toRgbString()
  static toHSL = color => new TinyColor(color).toHslString()
  static toHSV = color => new TinyColor(color).toHsvString()
  static toRGBPercent = color => new TinyColor(color).toPercentageRgbString()

  // Instance properties are used to store the color value on which the color operations will be applied.
  lightenColor = null
  brightenColor = null
  darkenColor = null
  spinColor = null
  desaturateColor = null
  saturateColor = null

  componentDidMount() {
    this.uploadElement = document.getElementById('uploader')
    this.imageIcon = document.getElementById('image-icon')

    this.imageIcon.addEventListener('click', this.simulateClick)

    // Attach a listener for deleting the image (if any) from the color block
    document.addEventListener('keydown', this.updateKey)
  }

  componentDidUpdate(oldProps, oldState) {
    // This is invoked only when we are working with actual API of this component

    if (oldProps.color !== this.props.color) {
      const color = new TinyColor(this.props.color)

      // Check if its a valid hex and then update the color
      // on changing the color input field, it only updates the color block if the hex code is valid
      if (color.isValid) {
        this.setState({ color })
      }
    }
  }

  componentWillUnmount() {
    this.imageIcon.removeEventListener('click', this.simulateClick)
    document.removeEventListener('keydown', this.updateKey)
  }

  updateColorState = (value, color, operation) => {
    value = parseInt(value)

    const newColor = new TinyColor(color)[operation](value)

    this.props.onChange && this.props.onChange(newColor.toHexString())
    this.setState({ [operation]: value })
  }

  getBuffer = () => ({
    SPIN: this.spinColor,
    DESATURATE: this.desaturateColor,
    SATURATE: this.saturateColor,
    LIGHTEN: this.lightenColor,
    BRIGHTEN: this.brightenColor,
    DARKEN: this.darkenColor
  })

  clearColorBuffer = name => {
    const bufferObj = this.getBuffer()

    Object.keys(bufferObj).forEach(key => {
      if (key !== name) {
        bufferObj[key] = null
      }
    })
  }

  /**
   * Below methods are used to handle color operations. Whenever an operation is performed on a color,
   * it mutates the original state of the color. So we use instance properties to clear and set the
   * currently active color state, and then apply the color operations w.r.t to the instance property (or current color value)
   *
   * TODO: Refactor this mess
   */

  // 'spin' operation spin (changes) the current hue
  handleSpin = e => {
    if (this.spinColor === null) {
      this.spinColor = this.state.color.originalInput
    }

    this.darkenColor = null
    this.lightenColor = null
    this.brightenColor = null
    this.desaturateColor = null
    this.saturateColor = null

    this.updateColorState(e.target.value, this.spinColor, 'spin')
  }

  // 'saturation' controls the intensity (or purity) of a color
  handleSaturate = e => {
    if (this.saturateColor === null) {
      this.saturateColor = this.state.color.originalInput
    }

    this.darkenColor = null
    this.lightenColor = null
    this.spinColor = null
    this.brightenColor = null
    this.desaturateColor = null

    this.updateColorState(e.target.value, this.saturateColor, 'saturate')
  }

  // 'desaturation' makes a color more muted (with black or grey)
  handleDesaturate = e => {
    if (this.desaturateColor === null) {
      this.desaturateColor = this.state.color.originalInput
    }

    this.darkenColor = null
    this.lightenColor = null
    this.spinColor = null
    this.brightenColor = null
    this.saturateColor = null

    this.updateColorState(e.target.value, this.desaturateColor, 'desaturate')
  }

  handleBrighten = e => {
    if (this.brightenColor === null) {
      this.brightenColor = this.state.color.originalInput
    }

    this.darkenColor = null
    this.lightenColor = null
    this.spinColor = null
    this.desaturateColor = null
    this.saturateColor = null

    this.updateColorState(e.target.value, this.brightenColor, 'brighten')
  }

  handleDarken = e => {
    if (this.darkenColor === null) {
      this.darkenColor = this.state.color.originalInput
    }

    this.brightenColor = null
    this.lightenColor = null
    this.spinColor = null
    this.desaturateColor = null
    this.saturateColor = null

    this.updateColorState(e.target.value, this.darkenColor, 'darken')
  }

  handleLighten = e => {
    if (this.lightenColor === null) {
      this.lightenColor = this.state.color.originalInput
    }

    this.brightenColor = null
    this.darkenColor = null
    this.spinColor = null
    this.desaturateColor = null
    this.saturateColor = null

    this.updateColorState(e.target.value, this.lightenColor, 'lighten')
  }

  // outputs the color according to the color format
  getColor = color => ({
    HSL: color.toHslString(),
    HEX: color.toHexString(),
    RGB: color.toRgbString(),
    HSV: color.toHsvString()
  })

  renderFormats = () =>
    this.state.formats.map((format, key) => {
      return (
        <option value={format} key={key}>
          {format}
        </option>
      )
    })

  // This handler is used to update the image state. After the colors are extracted from the image, a image can be removed from the color block.
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

  // Randomly generate new swatches
  generateSwatches = e => {
    let i = 0

    // Each swatch should be different
    const newColors = new Set()

    while (i < 12) {
      newColors.add(generateColors())
      i++
    }

    // Hide shades and tints when new swatches are added
    this.setState({
      swatches: [...newColors],
      showShades: false,
      showTints: false
    })
  }

  uploadImage = e =>
    this.setState({ image: window.URL.createObjectURL(e.target.files[0]) })

  updateSwatch = color => {
    if (this.desaturateColor !== null) {
      this.desaturateColor = null
    }

    if (this.saturateColor !== null) {
      this.saturateColor = null
    }

    if (this.lightenColor !== null) {
      this.lightenColor = null
    }

    if (this.darkenColor !== null) {
      this.darkenColor = null
    }

    if (this.brightenColor !== null) {
      this.brightenColor = null
    }

    if (this.spinColor !== null) {
      this.spinColor = null
    }

    this.setState({
      color: new TinyColor(color),
      spin: 0,
      saturate: 0,
      desaturate: 0,
      lighten: 0,
      darken: 0,
      brighten: 0
    })

    this.props.onChange && this.props.onChange(color)
  }

  // disable shades and tints when colors are extracted from an image
  updateSwatches = swatches =>
    this.setState({
      swatches: [...swatches],
      color: new TinyColor(swatches[0]),
      showShades: false,
      showTints: false
    })

  // Generates shades or tints from the currently selected hue (color)
  generateSwatchesFromHue = (term, showShades, showTints) => {
    const colorBuffer = []
    const color = new Values(this.state.color.toHexString())

    color[term]().forEach(c => colorBuffer.push(c.hexString()))

    this.setState({
      [term]: [...colorBuffer],
      showShades: showShades,
      showTints: showTints
    })
  }

  // Shades - A hue lightened with white
  generateShades = e => this.generateSwatchesFromHue('shades', true, false)

  // Tints - A hue darkened with black
  generateTints = e => this.generateSwatchesFromHue('tints', false, true)

  // Update the color format (hsv, rgb, hex, or hsl)
  changeFormat = e => this.setState({ currentFormat: e.target.value })

  // Reset the shades and tints
  resetColors = e =>
    this.setState({
      shades: [],
      tints: [],
      showShades: false,
      showTints: false
    })

  render() {
    const {
      image,
      swatches,
      shades,
      showShades,
      showTints,
      tints,
      currentFormat,
      darken,
      brighten,
      spin,
      lighten,
      desaturate,
      saturate
    } = this.state

    // Get the color string with a specified color format
    const color = this.getColor(this.state.color)[currentFormat]

    // Set the background color of color picker according to the current theme
    const bg = this.props.theme === 'dark' ? '#1f1f1f' : 'rgb(255, 255, 255)'

    // Set icon color according to the current theme
    const iconColor =
      this.props.theme === 'dark' ? 'rgb(255, 255, 255)' : '#000A14'

    return (
      <Container background={bg} width={'228px'}>
        {this.props.triangle &&
          this.state.image === null && (
            <Triangle color={this.state.color.toHexString()} />
          )}
        {this.state.image === null ? (
          <ColorBlock color={this.state.color}>
            <ActiveColor color={color} />
          </ColorBlock>
        ) : (
          <img
            src={this.state.image}
            alt="image"
            style={{ width: this.props.width }}
          />
        )}
        {image && (
          <ColorExtractor
            maxColors={this.props.maxColors}
            src={image}
            getColors={this.updateSwatches}
          />
        )}
        <div style={{ padding: 10 }}>
          {showShades ? (
            <Swatches
              swatches={shades}
              updateSwatch={this.updateSwatch}
              onSwatchHover={this.props.onSwatchHover}
            />
          ) : showTints ? (
            <Swatches
              swatches={tints}
              updateSwatch={this.updateSwatch}
              onSwatchHover={this.props.onSwatchHover}
            />
          ) : (
            <Swatches
              swatches={swatches}
              updateSwatch={this.updateSwatch}
              onSwatchHover={this.props.onSwatchHover}
            />
          )}
          <ColorInput value={color} onChange={this.props.onChange} />
          <ColorFormatPicker
            changeFormat={this.changeFormat}
            renderFormats={this.renderFormats}
          />
          <Provider value={iconColor}>
            <div
              className={css`
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                grid-gap: 5px;
                margin-right: -20px;
                margin-top: 20px;
              `}
            >
              <ImagePicker uploadImage={this.uploadImage} />
              <PaletteGenerator generateSwatches={this.generateSwatches} />
              <TintsGenerator generateTints={this.generateTints} />
              <ShadesGenerator generateShades={this.generateShades} />
              <Clipboard
                copyColor={e => navigator.clipboard.writeText(color)}
              />
              <Reset resetColors={this.resetColors} />
            </div>
          </Provider>
          {this.props.showTools ? (
            <div>
              <Provider value={iconColor}>
                <ul>
                  <li>
                    <Tools.ColorSpinner
                      value={spin}
                      onChange={this.handleSpin}
                    />
                  </li>
                  <li>
                    <Tools.ColorSaturator
                      value={saturate}
                      onChange={this.handleSaturate}
                    />
                  </li>
                  <li>
                    <Tools.ColorDesaturator
                      value={desaturate}
                      onChange={this.handleDesaturate}
                    />
                  </li>
                  <li>
                    <Tools.ColorDarkener
                      value={darken}
                      onChange={this.handleDarken}
                    />
                  </li>
                  <li>
                    <Tools.ColorLightener
                      value={lighten}
                      onChange={this.handleLighten}
                    />
                  </li>
                  <li>
                    <Tools.ColorBrightener
                      value={brighten}
                      onChange={this.handleBrighten}
                    />
                  </li>
                </ul>
              </Provider>
            </div>
          ) : null}
        </div>
      </Container>
    )
  }
}
