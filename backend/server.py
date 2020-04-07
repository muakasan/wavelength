from flask import Flask, render_template
from flask_socketio import SocketIO
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

# TODO load
possible_clues = [
    ('Underrated letter of the alphabet', 'Overrated letter of the alphabet'),
    ('Weird', 'Strange'),
    ('Small', 'Tiny'),
    ('For kids', 'For adults'),
]
random.shuffle(possible_clues)
clue_idx = 0

@socketio.on('requestGameState')
def handle_request_game_state():
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('setDialPosition')
def handle_set_dial_position(j):
    if game_state['screenClosed']:
        game_state['dialPosition'] = j['dialPosition']
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('reveal')
def handle_reveal():
    game_state['screenClosed'] = False

    # TODO figure out if you always get one point, and hi/lo
    distance = abs(game_state['targetPosition'] - game_state['dialPosition'])

    score = 0
    if distance * 180 <= 7.5 * 0.5:
        score = 4
    elif distance * 180 <= 7.5 * 1.5:
        score = 3
    elif distance * 180 <= 7.5 * 2.5:
        score = 2

    game_state['score'][game_state['turn']] += score
    game_state['lastScore'] = score

    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('nextRound')
def handle_next_round():
    # TODO gross make this nicer
    global possible_clues

    game_state['screenClosed'] = True
    game_state['targetPosition'] = random_target_pos()

    game_state['roundNum'] += 1

    # second turn, catch-up mechanic
    if not (game_state['lastScore'] >= 4 and game_state['score'][game_state['turn']] < game_state['score'][1 - game_state['turn']]):
        game_state['turn'] = 1 - game_state['turn']

    if game_state['roundNum'] % len(possible_clues) == 0:
        random.shuffle(possible_clues)

    game_state['clues'] = possible_clues[game_state['roundNum'] % len(possible_clues)]

    socketio.emit('gameState', game_state, json=True, broadcast=True)

def random_target_pos():
    return random.uniform(0.05, 0.95)

game_state = {
    'dialPosition': 0.5,
    'screenClosed': True,
    'targetPosition': random_target_pos(),
    'clues': possible_clues[0],
    'roundNum': 0,
    'score': [0, 1],
    'turn': 0,
    'lastScore': 0,
}

if __name__ == '__main__':
    socketio.run(app)
