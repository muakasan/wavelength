from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

game_state = {
        'dial_position' : 0.5
        }

@socketio.on('requestGameState')
def handle_request_game_state():
    socketio.emit('gameState', game_state, json=True, broadcast=True)

@socketio.on('setDialPosition')
def handle_set_dial_position(j):
    print(j)
    game_state['dial_position'] = j['dial_position']
    socketio.emit('gameState', game_state, json=True, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)
