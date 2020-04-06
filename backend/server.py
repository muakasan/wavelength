from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

game_state = {
        'dialPosition' : 0.5
        }

@socketio.on('requestGameState')
def handle_request_game_state():
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('setDialPosition')
def handle_set_dial_position(j):
    game_state['dialPosition'] = j['dialPosition']
    socketio.emit('gameState', game_state, json=True, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)
