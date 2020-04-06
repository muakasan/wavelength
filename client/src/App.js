import React from "react";
import "./App.scss";

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Device />
      </div>
    );
  }
}

class Device extends React.Component {
  constructor(props) {
    super(props);

    this.deviceInner = React.createRef();
    this.state = {
      rotation: 0,
    };
  }

  dialClicked = (event) => {
    const rect = this.deviceInner.current.getBoundingClientRect();

    const xOrigin = rect.x + rect.width / 2;
    const yOrigin = rect.y + rect.height;

    const xOffset = event.clientX - xOrigin;
    const yOffset = event.clientY - yOrigin;

    this.setState({
      rotation: Math.PI - Math.atan2(xOffset, yOffset),
    });
  };

  render() {
    const { rotation } = this.state;

    return (
      <div className="device_parent">
        <div className="device_outer">
          <div className="device">
            <div className="device_red" />
            <div className="device_wing_l" />
            <div className="device_wing_r" />

            <div
              className="device_inner"
              ref={this.deviceInner}
              onMouseDown={this.dialClicked}
            >
              <div
                className="dial"
                style={{ transform: `rotate(${rotation}rad)` }}
              />
              <div
                className="target"
                style={{ transform: `rotate(${rotation}rad)` }}
              >
                <span class="number">4</span>
              </div>
              <div className="target" style={{ transform: `rotate(13deg)` }}>
                <span class="number">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
