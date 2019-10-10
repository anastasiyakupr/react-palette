import React from 'react'
import { BasicPicker } from 'react-color-tools'

class App extends React.Component {
  state = {
    color: '#2F9D66'
  }

  render() {
    const { color } = this.state

    return (
      <div>
        <h1 style={{ color }}>React Color Tools</h1>
        <BasicPicker
          color={color}
          onChange={color => this.setState({ color })}
          theme="dark"
          showTools={true}
        />
      </div>
    )
  }
}
