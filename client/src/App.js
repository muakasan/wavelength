import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import "./App.scss";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Device />
      </div>
    );
  }
}

class Device extends Component {
  constructor(props) {
    super(props);

    this.deviceInner = React.createRef();
    this.state = {
      gameState: {
        dialPosition: 0.5,
      },
      client: null,
    };
  }

  componentDidMount() {
    const client = socketIOClient("http://127.0.0.1:5000/");

    client.on("connect", () => {
      client.emit("requestGameState");
    });
    client.on("gameState", (updatedState) => {
      this.setState({
        gameState: updatedState,
      });
    });
    this.setState({
      client: client,
    });
  }

  dialClicked = (event) => {
    const rect = this.deviceInner.current.getBoundingClientRect();

    const xOrigin = rect.x + rect.width / 2;
    const yOrigin = rect.y + rect.height;

    const xOffset = event.clientX - xOrigin;
    const yOffset = event.clientY - yOrigin;

    let rotation = 2 * Math.PI - Math.atan2(xOffset, yOffset);
    if (rotation > 2 * Math.PI) {
      rotation -= 2 * Math.PI;
    }

    let dialPosition = rotation / Math.PI - 0.5;
    dialPosition = Math.min(dialPosition, 0.95);
    dialPosition = Math.max(dialPosition, 0.05);

    this.setState({
      gameState: {
        dialPosition: dialPosition,
      },
    });

    this.state.client.emit("setDialPosition", this.state.gameState);
  };

  render() {
    const { dialPosition } = this.state.gameState;
    const rotation = Math.PI * (dialPosition + 1.5);

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
              <div className="target" style={{ transform: `rotate(26.8deg)` }}>
                <span className="number">3</span>
              </div>
              <div className="target" style={{ transform: `rotate(20deg)` }}>
                <span className="number">4</span>
              </div>
              <div className="target" style={{ transform: `rotate(13.2deg)` }}>
                <span className="number">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
