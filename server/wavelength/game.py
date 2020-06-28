from wavelength.game_state import GameState
from wavelength.clues import CluePool, get_or_load_clues
from flask_socketio import SocketIO, join_room
import random
import json


class Game:
    def __init__(self, sio: SocketIO, game_code: str):
        self.sio = sio
        self.game_code = game_code
        self.new_game()

    def emit_game_state(self) -> None:
        self.sio.emit("gameState", self.state.encode(), json=True, room=self.game_code)

    def new_game(self) -> None:
        self.state = GameState()
        self.state.use_clue_pool(CluePool.DEFAULT)
        self.state.randomize_target()
        self.state.randomize_clue_color()

        self.emit_game_state()

    def request_game_state(self) -> None:
        join_room(self.game_code)
        self.emit_game_state()

    def set_left_right(self, lr: int) -> None:
        if self.state.complete:
            self.emit_game_state()
            return

        if self.state.screenClosed and type(lr) is int and lr in [0, 1]:
            self.state.leftRight = lr
        self.emit_game_state()

    def set_dial_position(self, dial_position: float) -> None:
        if self.state.complete:
            self.emit_game_state()
            return

        if (
            self.state.screenClosed
            and type(dial_position) is float
            and 0.05 <= dial_position <= 0.95
        ):
            self.state.dialPosition = dial_position
        self.emit_game_state()

    def reveal(self) -> None:
        if self.state.complete:
            self.emit_game_state()
            return

        self.state.screenClosed = False

        difference = self.state.targetPosition - self.state.dialPosition
        distance = abs(difference)

        score = 0
        if distance * 180 <= 7.5 * 0.5:
            score = 4
        elif distance * 180 <= 7.5 * 1.5:
            score = 3
        elif distance * 180 <= 7.5 * 2.5:
            score = 2

        if score < 4:
            if difference < 0 and self.state.leftRight == 0:
                self.state.score[1 - self.state.turn] += 1
            elif difference > 0 and self.state.leftRight == 1:
                self.state.score[1 - self.state.turn] += 1

        self.state.score[self.state.turn] += score
        self.state.lastScore = score

        # TODO handle ties, sudden death (lots of work)
        if self.state.score[0] >= 10 or self.state.score[1] >= 10:
            self.state.complete = True

        self.emit_game_state()

    def next_round(self) -> None:
        if self.state.complete:
            self.emit_game_state()
            return

        self.state.screenClosed = True
        self.state.randomize_target()

        self.state.roundNum += 1

        # second turn, catch-up mechanic
        if not (
            self.state.lastScore >= 4
            and self.state.score[self.state.turn]
            < self.state.score[1 - self.state.turn]
        ):
            self.state.turn = 1 - self.state.turn

        self.state.randomize_clue_color()

        if self.state.roundNum % len(self.state.clueList) == 0:
            random.shuffle(self.state.clueList)

        self.state.clues = self.state.clueList[
            self.state.roundNum % len(self.state.clueList)
        ]

        self.emit_game_state()
