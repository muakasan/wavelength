import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useParams,
  useHistory,
} from "react-router-dom";
import socketIOClient from "socket.io-client";
import "./App.scss";

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Homepage} />

        <Route path="/:lobbyId" children={<Game />} />
      </Switch>
    </Router>
  );
}

class Homepage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formText: "",
    };
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { formText } = this.state;
    this.props.history.push("/" + formText + "/");
  };

  onChange = (event) => {
    this.setState({
      formText: event.target.value,
    });
  };

  render() {
    const { formText } = this.state;
    return (
      <div className="homepage">
        <h1>WAVELENGTH</h1>
        <form onSubmit={this.handleSubmit}>
          <input type="text" value={formText} onChange={this.onChange} />
        </form>
      </div>
    );
  }
}

function Game() {
  let { lobbyId } = useParams();
  return <Device lobbyId={lobbyId} />;
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
        leftRight: 0,
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
    const client = socketIOClient("/");
    const { lobbyId } = this.props;

    client.on("connect", () => {
      client.emit("requestGameState", lobbyId);
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

  leftRightClicked = (event) => {
    const { client, gameState, psychic, controlsDisabled } = this.state;
    const { lobbyId } = this.props;

    if (!gameState.screenClosed || psychic || controlsDisabled) {
      return;
    }

    this.setState(
      {
        gameState: {
          ...gameState,
          leftRight: 1 - gameState.leftRight,
        },
      },
      () => {
        client.emit("setLeftRight", lobbyId, this.state.gameState.leftRight);
      }
    );
  };

  newGameClicked = (event) => {
    let { client, controlsDisabled } = this.state;
    const { lobbyId } = this.props;

    if (controlsDisabled) {
      return;
    }

    this.disableControls();
    this.state.client.emit("newGame", lobbyId);
  };

  dialClicked = (event) => {
    const { client, gameState, psychic, controlsDisabled } = this.state;
    const { lobbyId } = this.props;
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
        client.emit(
          "setDialPosition",
          lobbyId,
          this.state.gameState.dialPosition
        );
      }
    );
  };

  screenHandleClicked = (event) => {
    let { client, gameState, controlsDisabled } = this.state;
    let { screenClosed, targetPosition } = gameState;
    const { lobbyId } = this.props;

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
          client.emit("reveal", lobbyId);
        } else {
          this.setState({
            psychic: false,
          });
          client.emit("nextRound", lobbyId);
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
      leftRight,
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
          <LeftRight
            leftRight={leftRight}
            onMouseDown={this.leftRightClicked}
            psychic={psychic}
          />
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

class LeftRight extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hover: false,
    };
  }

  render() {
    const { leftRight, psychic, onMouseDown } = this.props;
    const { hover } = this.state;

    const cls =
      (hover && !psychic ? "hovered" : "") +
      (leftRight == 1 ? " toggled" : "") +
      " leftRight";

    return (
      <div
        className={cls}
        onMouseDown={(event) => {
          this.setState({
            hover: false,
          });
          onMouseDown(event);
        }}
        onMouseLeave={() => this.setState({ hover: false })}
        onMouseEnter={() => this.setState({ hover: true })}
      >
        <div className="leftRightInner">
          <div className="leftBox">Left</div>
          <div className="rightBox">Right</div>
        </div>
      </div>
    );
  }
}

// All clue card colors
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
    // Only animate if clue changes
    if (
      prevProps.clues[0].length > 0 &&
      (JSON.stringify(prevProps.clues) != JSON.stringify(this.props.clues) ||
        prevProps.color != this.props.color)
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
