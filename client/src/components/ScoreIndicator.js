import React, { Component } from "react";

import { Team } from "../enums";
import { LeftBrain, RightBrain } from "./Shapes";

export default class ScoreIndicator extends Component {
  render() {
    const { team, isTurn, score } = this.props;

    return (
      <div
        className={
          (isTurn ? "turn" : "") +
          " score " +
          (team === Team.LEFT_BRAIN ? "leftBrain" : "rightBrain")
        }
      >
        {team === Team.LEFT_BRAIN ? <LeftBrain /> : <RightBrain />}
        <span className="value">{score}</span>
      </div>
    );
  }
}
