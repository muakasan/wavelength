from typing import List
from enum import Enum


class CluePool(Enum):
    DEFAULT = 0


clue_file_map = {CluePool.DEFAULT: "wavelength.csv"}

clue_map = {}


def get_or_load_clues(pool: CluePool) -> List[str]:
    if pool in clue_map:
        return clue_map[pool]

    clues = []
    filepath = clue_file_map[pool]
    with open(filepath) as f:
        next(f)  # Gets read of header line
        for line in f:
            clues.append(tuple(line.strip().split(",")))
    clue_map[pool] = clues

    return clues
