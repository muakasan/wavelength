from typing import List, Dict, Tuple, Any
from wavelength.clues import CluePool, get_or_load_clues
from dataclasses import dataclass, field, asdict
import random

@dataclass
class GameState:
    dialPosition: float = 0.5
    screenClosed: bool = True 
    targetPosition: float = 0.5
    clueList: List[Tuple[str]] = field(default_factory=lambda: [])
    clues: Tuple[str] = field(default_factory=lambda: ())
    clueColor: int = 0
    roundNum: int = 0
    score: List[int] = field(default_factory=lambda: [0, 0])
    turn: int = 0
    lastScore: int = 0
    leftRight: int = 0
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