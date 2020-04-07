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
        clues: ["", ""],
        clueColor: 0,
        score: [0, 0],
        turn: 0,
      },
      psychic: false,
      controlsDisabled: false,
      client: null,
      roundNum: 0,
      gameId: 0,
    };
  }

  disableControls() {
    this.setState({
      controlsDisabled: true,
    });
    window.setTimeout(() => {
      this.setState({
        controlsDisabled: false,
      });
    }, 1010);
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

      // Reset peek on new round
      let psychic = this.state.psychic;
      if (
        updatedState.roundNum != gameState.roundNum ||
        updatedState.gameId != gameState.gameId
      ) {
        psychic = false;
        this.disableControls();
      }

      this.setState({
        gameState: { ...gameState, ...updatedState },
        psychic: psychic,
      });

      window.setTimeout(() => {
        const gameState = this.state.gameState;
        this.setState({
          gameState: { ...gameState, targetPosition: targetPosition },
        });
      }, 1010);
    });
    this.setState({
      client: client,
    });
  }

  togglePsychicClicked = (event) => {
    const { psychic, controlsDisabled } = this.state;

    if (controlsDisabled) {
      return;
    }

    this.setState({
      psychic: !psychic,
    });
  };

  newGameClicked = (event) => {
    let { client, controlsDisabled } = this.state;

    if (controlsDisabled) {
      return;
    }

    this.state.client.emit("newGame");
  };

  dialClicked = (event) => {
    const { client, gameState, psychic, controlsDisabled } = this.state;
    if (!gameState.screenClosed || psychic || controlsDisabled) {
      return;
    }

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
    let { client, gameState, controlsDisabled } = this.state;
    let { screenClosed, targetPosition } = gameState;

    if (controlsDisabled) {
      return;
    }

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
          this.setState({
            psychic: false,
          });
          client.emit("nextRound");
        }
      }
    );
  };

  render() {
    const { psychic, gameState } = this.state;
    const {
      dialPosition,
      screenClosed,
      targetPosition,
      clues,
      clueColor,
      score,
      turn,
    } = gameState;
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
                className={(psychic ? "peek" : "") + " screen"}
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
          <div className="togglePeek" onMouseDown={this.togglePsychicClicked}>
            Psychic
          </div>
          <Clue clues={clues} color={clueColor} />
          <div className={(turn == 0 ? "turn" : "") + " score1"}>
            {score[0]}
          </div>
          <div className={(turn == 1 ? "turn" : "") + " score2"}>
            {score[1]}
          </div>
          <div className="newGame" onMouseDown={this.newGameClicked}>
            New Game
          </div>
        </div>
      </div>
    );
  }
}

const CLUE_COLORS = [
  ["#d0e6cd", "#1f9ec1"],
  ["#694e72", "#e7dfc9"],
  ["#127b6e", "#e8c7d1"],
  ["#5fb763", "#fdfbef"],
  ["#fdf9ef", "#932957"],
  ["#e9c8d0", "#d74227"],
  ["#d74227", "#9ad8f2"],
  ["#e9dfc8", "#1c9fc0"],
  ["#179fc1", "#e8c6cf"],
  ["#e7dfc7", "#d74227"],
  ["#dd89a1", "#edb245"],
  ["#147b6e", "#cee6cd"],
  ["#cee6cd", "#5eb663"],
  ["#b57d2b", "#209ec0"],
  ["#942657", "#e1694f"],
  ["#817289", "#77bdbb"],
  ["#91cecb", "#d74327"],
  ["#ebbec0", "#eba920"],
  ["#cfe2d7", "#ec5a3d"],
];

function randomClueColor() {
  return CLUE_COLORS[Math.floor(Math.random() * CLUE_COLORS.length)];
}

class Clue extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hide: false,
      oldClues: ["", ""],
      oldColor: 0,
    };
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.clues[0].length > 0 &&
      JSON.stringify(prevProps.clues) != JSON.stringify(this.props.clues)
    ) {
      this.setState({
        hide: true,
        oldClues: prevProps.clues,
        oldColor: prevProps.color,
      });
      window.setTimeout(() => {
        this.setState({
          hide: false,
        });
      }, 600);
    }
  }

  render() {
    const { clues, color } = this.props;
    const { hide, oldClues, oldColor } = this.state;
    return (
      <>
        <div className={(hide ? "hide" : "") + " clue"}>
          <div
            className="clueLeft"
            style={{
              backgroundColor: hide
                ? CLUE_COLORS[oldColor][0]
                : CLUE_COLORS[color][0],
            }}
          >
            <div className="text">{hide ? oldClues[0] : clues[0]}</div>
            <Arrow direction={"left"} />
          </div>
          <div
            className="clueRight"
            style={{
              backgroundColor: hide
                ? CLUE_COLORS[oldColor][1]
                : CLUE_COLORS[color][1],
            }}
          >
            <div className="text">{hide ? oldClues[1] : clues[1]}</div>
            <Arrow direction={"right"} />
          </div>
        </div>
        <div className="clueHole" />
      </>
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
