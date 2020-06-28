import React, { Component } from "react";
import {
  useParams,
} from "react-router-dom";
import socketIOClient from "socket.io-client";

import { LeftBrain, RightBrain } from "../components/Shapes";
import LeftRight from "../components/LeftRight";
import Clue from "../components/Clue";
import Target from "../components/Target";

export default function Game() {
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
        complete: false,
        leftRight: 0,
      },
      psychic: false,
      controlsDisabled: false,
      client: null,
      roundNum: 0,
      gameId: 0,
      loading: true,
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
    const serverUrl = process.env.NODE_ENV === "production" ? "/" : ":8080/";
    const client = socketIOClient(serverUrl);
    const { lobbyId } = this.props;

    client.on("connect", () => {
      client.emit("requestGameState", lobbyId);
      console.log("REQUEST GAME STATE " + lobbyId);
    });
    client.on("gameState", (updatedState) => {
      const gameState = this.state.gameState;

      // If we update target position right away it reveals the result...
      const targetPosition = updatedState.targetPosition;
      if (!this.state.loading) {
        delete updatedState.targetPosition;
      }

      // Reset peek on new round
      let psychic = this.state.psychic;
      if (
        updatedState.roundNum !== gameState.roundNum ||
        updatedState.gameId !== gameState.gameId
      ) {
        psychic = false;
        this.disableControls();
      }

      this.setState({
        gameState: { ...gameState, ...updatedState },
        psychic: psychic,
        loading: false,
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
    client.emit("newGame", lobbyId);
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
    const { psychic, gameState, loading } = this.state;
    const {
      dialPosition,
      screenClosed,
      targetPosition,
      clues,
      clueColor,
      score,
      turn,
      leftRight,
      complete,
    } = gameState;
    const rotation = Math.PI * (dialPosition + 1.5);
    const winner = score[0] <= score[1];

    if (loading) {
      return (
        <div className="device_parent">
          <div className="device_outer">
            <div className="device">
              <div className="device_red" />
              <div className="device_wing_l" />
              <div className="device_wing_r" />
              <div className="device_inner" />
            </div>
          </div>
        </div>
      );
    }

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
                style={{ transform: `rotate(${screenClosed ? 360 : 187}deg)` }}
              />
            </div>

            <div
              className="screenHandle"
              onMouseDown={
                complete ? this.newGameClicked : this.screenHandleClicked
              }
              style={{
                transform: `rotate(${screenClosed ? 356.5 : 183.5}deg)`,
              }}
            >
              <div
                className={
                  (screenClosed ? "" : "flipped") + " screenHandleText"
                }
              >
                <span>{screenClosed ? "Reveal" : "Next Round"}</span>
              </div>
            </div>
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
          <div className={(turn === 0 ? "turn" : "") + " score leftBrain"}>
            <LeftBrain />
            <span className="value">{score[0]}</span>
          </div>
          <div className={(turn === 1 ? "turn" : "") + " score rightBrain"}>
            <RightBrain />
            <span className="value">{score[1]}</span>
          </div>
          {complete ? (
            <div className="gameOver">
              {winner ? <RightBrain /> : <LeftBrain />}
              Team {winner ? "Right" : "Left"} Brain wins!
              <div className="newGame" onMouseDown={this.newGameClicked}>
                New Game
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}
