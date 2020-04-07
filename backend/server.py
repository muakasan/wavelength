from flask import Flask, render_template
from flask_socketio import SocketIO
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

@socketio.on('requestGameState')
def handle_request_game_state():
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('setDialPosition')
def handle_set_dial_position(j):
    game_state['dialPosition'] = j['dialPosition']
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('reveal')
def handle_reveal():
    game_state['screenClosed'] = False

    # TODO score here
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('nextRound')
def handle_next_round():
    game_state['screenClosed'] = True
    game_state['targetPosition'] = random_target_pos()

    socketio.emit('gameState', game_state, json=True, broadcast=True)

def random_target_pos():
    return random.uniform(0.05, 0.95)

game_state = {
    'dialPosition': 0.5,
    'screenClosed': True,
    'targetPosition': random_target_pos(),
}

if __name__ == '__main__':
    socketio.run(app)
