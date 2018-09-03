import React from 'react'

const ImagePicker = ({ uploadImage }) => (
	<span title="Image picker">
		<input id="uploader" style={{ display: 'none' }} type="file" accept="image/*" onChange={uploadImage} />
		<i id="image-icon" className="fas fa-image" />
	</span>
)

export default ImagePicker
