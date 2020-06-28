import React, { Component } from "react";
import { Direction } from "../enums";

export default class DirectionToggle extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hover: false,
    };
  }

  render() {
    const { direction, psychic, onMouseDown } = this.props;
    const { hover } = this.state;

    const cls =
      (hover && !psychic ? "hovered" : "") +
      (direction === Direction.RIGHT ? " toggled" : "") +
      " directionToggle";

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
        <div className="directionToggleInner">
          <div className="leftBox">Left</div>
          <div className="rightBox">Right</div>
        </div>
      </div>
    );
  }
}
