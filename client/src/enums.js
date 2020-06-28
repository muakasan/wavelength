const Team = {
  LEFT_BRAIN: "left_brain",
  RIGHT_BRAIN: "right_brain",
};

const Direction = {
  LEFT: "left",
  RIGHT: "right",
  getOther: (dir) => {
    return dir == "left" ? "right" : "left";
  },
};

export { Team, Direction };
