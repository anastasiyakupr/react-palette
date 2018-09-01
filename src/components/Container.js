import React from 'react'
import { css } from 'emotion'

const Container = ({ children }) => (
	<div
		className={css`
			width: 170px;
			background: rgb(255, 255, 255);
			box-shadow: rgba(0, 0, 0, 0.1) 0px 1px;
			border-radius: 6px;
			position: relative;
		`}
	>
		{children}
	</div>
)

export default Container
