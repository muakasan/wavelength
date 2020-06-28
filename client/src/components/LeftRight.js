import React, { Component } from "react";

export default class LeftRight extends Component {
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
      (leftRight === 1 ? " toggled" : "") +
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
