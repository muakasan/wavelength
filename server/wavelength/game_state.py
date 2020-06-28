from typing import List, Dict, Tuple, Any
from enum import Enum
from dataclasses import dataclass, field, asdict
import random

from wavelength.clues import CluePool, get_or_load_clues


class Team(str, Enum):
    LEFT_BRAIN = "left_brain"
    RIGHT_BRAIN = "right_brain"

    def other(self) -> "Team":
        if self == Team.LEFT_BRAIN:
            return Team.RIGHT_BRAIN
        else:
            return Team.LEFT_BRAIN


class Direction(str, Enum):
    LEFT = "left"
    RIGHT = "right"

    def other(self) -> "Direction":
        if self == Team.LEFT:
            return Team.RIGHT
        else:
            return Team.LEFT


@dataclass
class GameState:
    dialPosition: float = 0.5
    screenClosed: bool = True
    targetPosition: float = 0.5
    clueList: List[Tuple[str]] = field(default_factory=lambda: [])
    clues: Tuple[str] = field(default_factory=lambda: ())
    clueColor: int = 0
    roundNum: int = 0
    score: Dict[Team, int] = field(
        default_factory=lambda: {Team.LEFT_BRAIN: 0, Team.RIGHT_BRAIN: 0}
    )
    turn: Team = Team.LEFT_BRAIN
    direction: Direction = Direction.LEFT
    complete: bool = False

    def encode(self) -> Dict[str, Any]:
        return asdict(self)

    def use_clue_pool(self, pool: CluePool) -> None:
        self.clueList = get_or_load_clues(pool)[:]
        random.shuffle(self.clueList)

        self.clues = self.clueList[0]

    def randomize_target(self) -> None:
        self.targetPosition = random.uniform(0.05, 0.95)

    def randomize_clue_color(self) -> None:
        self.clueColor = random.randint(0, 18)
