import React, { Component } from "react";

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

export default class Clue extends Component {
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
      (JSON.stringify(prevProps.clues) !== JSON.stringify(this.props.clues) ||
        prevProps.color !== this.props.color)
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
