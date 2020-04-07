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
        screenClosed: true,
        targetPosition: 0,
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
      const gameState = this.state.gameState;

      // If we update target position right away it reveals the result...
      const targetPosition = updatedState.targetPosition;
      delete updatedState.targetPosition;

      this.setState({
        gameState: { ...gameState, ...updatedState },
      });

      window.setTimeout(() => {
        const gameState = this.state.gameState;
        this.setState({
          gameState: {...gameState, targetPosition: targetPosition},
        });
      }, 1100);
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

    const { client, gameState } = this.state;

    this.setState(
      {
        gameState: {
          ...gameState,
          dialPosition: dialPosition,
        },
      },
      () => {
        client.emit("setDialPosition", this.state.gameState);
      }
    );
  };

  screenHandleClicked = (event) => {
    let { client, gameState } = this.state;
    let { screenClosed, targetPosition } = gameState;

    this.setState(
      {
        gameState: {
          ...gameState,
          screenClosed: !screenClosed,
          targetPosition: targetPosition,
        },
      },
      () => {
        if (screenClosed) {
          client.emit("reveal");
        } else {
          client.emit("nextRound");
        }
      }
    );
  };

  render() {
    const { dialPosition, screenClosed, targetPosition } = this.state.gameState;
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
              <Target targetPosition={targetPosition} />
              <div
                className="screen"
                style={{ transform: `rotate(${screenClosed ? 360 : 181}deg)` }}
              />
            </div>

            <div
              className="screenHandle"
              onMouseDown={this.screenHandleClicked}
              style={{
                transform: `rotate(${screenClosed ? 360 + 90 : 181 + 90}deg)`,
              }}
            />
          </div>
          <div className="clue">
            <div className="clueLeft">
              <div className="text">Underrated letter of the alphabet</div>
              <Arrow direction={"left"} />
            </div>
            <div className="clueRight">
              <div className="text">Overrated letter of the alphabet</div>
              <Arrow direction={"right"} />
            </div>
          </div>
          <div className="clueHole" />
        </div>
      </div>
    );
  }
}

class Arrow extends Component {
  render() {
    const { direction } = this.props;
    return (
      <>
        <div className="arrowBase" />
        <div className={direction + " arrowTip"} />
      </>
    );
  }
}

class Target extends Component {
  render() {
    const { targetPosition } = this.props;
    const width = 7.5;
    const rotation = 180 * targetPosition - width / 2;

    return (
      <>
        <div
          className={"target two"}
          style={{ transform: `rotate(${rotation + 2 * width}deg)` }}
        >
          <span className="number">2</span>
        </div>
        <div
          className={"target two"}
          style={{ transform: `rotate(${rotation - 2 * width}deg)` }}
        >
          <span className="number">2</span>
        </div>
        <div
          className={"target three"}
          style={{ transform: `rotate(${rotation + width}deg)` }}
        >
          <span className="number">3</span>
        </div>

        <div
          className={"target three"}
          style={{ transform: `rotate(${rotation - width}deg)` }}
        >
          <span className="number">3</span>
        </div>
        <div
          className={"target four"}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <span className="number">4</span>
        </div>
      </>
    );
  }
}

export default App;
