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

    # TODO score here
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('nextRound')
def handle_next_round():
    # TODO gross make this nicer
    global possible_clues

    game_state['screenClosed'] = True
    game_state['targetPosition'] = random_target_pos()

    game_state['clueIdx'] += 1

    if game_state['clueIdx'] >= len(possible_clues):
        game_state['clueIdx'] = 0
        random.shuffle(possible_clues)
        
    game_state['clues'] = possible_clues[game_state['clueIdx']]

    socketio.emit('gameState', game_state, json=True, broadcast=True)

def random_target_pos():
    return random.uniform(0.05, 0.95)

game_state = {
    'dialPosition': 0.5,
    'screenClosed': True,
    'targetPosition': random_target_pos(),
    'clues': possible_clues[0],
    'clueIdx': 0,
}

if __name__ == '__main__':
    socketio.run(app)
