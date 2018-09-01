# React Palette

> Palette for React components

## Table of contents

- [Introduction](#introduction)

- [Features](#features)

- [Use cases](#use-cases)

- [Start](#start)

- [License](#license)

## Introduction

Provides a set of tools as React components for working with colors. These tools can be used to manipulate a color for example controlling the intensity or purity of color, extracting swatches from an image, creating a gradienty defining color stop positions, choosing from variety of shades and tints or choosing a color scheme.

## Features

- Image color extraction

- Generate shades and tints

- Built-in color manipulation tools

- Create gradient by controlling the color stop positions

- API for color conversions

- Color scheme picker

## Use cases

- Managing color schemes

- Design systems & creating design tools

### Color terms

- **Hue** - A hue is name of particular color, or it is also one of the 12 colors on the color wheel.

- **Shade** - A shade is a hue darkened with black.

- **Tint** - A tint is a hue lightened with gray.

- **Saturation** - Describes the intensity or purity of color.

- **Desaturation** - Desaturation makes a color look more muted (hue approaches closer to gray).

### Color schemes

- **Monochromatic** - This color scheme contains tints, shades and tones of a color.

- **Analogous** - This color scheme contains the hues that are located side by side on the color wheel.

- **Split Complementary** - This scheme represent any color on the color wheel plus two colors that are it's complement.

- **Triadic** - This color scheme has three colors that are evenly spaced on the color wheel.

- **Tetradic** - Two pairs of colors which are opposite on the color wheel

## Start

```
npm install
```

```
npm start
```

### Linting

Run eslint using `yarn lint`

### Building the source code

Run `yarn build` to build the source code. To use the watch mode, run the cmd `yarn build:watch`

### Formatting with Prettier

Run `yarn formatall` to format the source code.

### Test

Run `yarn test` to test the pickers.

## License

MIT
