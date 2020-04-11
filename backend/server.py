from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, join_room
import random
import os

app = Flask(__name__, static_folder='../client/build')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

possible_clues = []
games = {}

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

def load_clues(filename):
    possible_clues = []
    with open(filename) as f:
        next(f) # Gets read of header line
        for line in f:
            possible_clues.append(tuple(line.split(',')))
    return possible_clues


def active_game(func):
    def wrapper(*args):
        global games

        game_code = args[0]
        game_state = get_or_create_state(game_code)

        new_args = [game_state] + list(args)

        ret = func(*new_args)
        if ret is not None:
            games[game_code] = ret
    return wrapper
    
@socketio.on('requestGameState')
@active_game
def handle_request_game_state(game_state, game_code):
    join_room(game_code)
    socketio.emit('gameState', game_state, json=True, room=game_code)

@socketio.on('setLeftRight')
@active_game
def handle_set_left_right(game_state, game_code, lr):
    if game_state['complete']:
        socketio.emit('gameState', game_state, json=True, room=game_code)
        return

    if game_state['screenClosed'] and type(lr) is int and lr in [0, 1]:
        game_state['leftRight'] = lr
    socketio.emit('gameState', game_state, json=True, room=game_code)

@socketio.on('setDialPosition')
@active_game
def handle_set_dial_position(game_state, game_code, pos):
    if game_state['complete']:
        socketio.emit('gameState', game_state, json=True, room=game_code)
        return

    if game_state['screenClosed'] and type(pos) is float and pos >= 0.05 and pos <= 0.95:
        game_state['dialPosition'] = pos
    socketio.emit('gameState', game_state, json=True, room=game_code)

@socketio.on('reveal')
@active_game
def handle_reveal(game_state, game_code):
    if game_state['complete']:
        socketio.emit('gameState', game_state, json=True, room=game_code)
        return

    game_state['screenClosed'] = False

    difference = game_state['targetPosition'] - game_state['dialPosition']
    distance = abs(difference)

    score = 0
    if distance * 180 <= 7.5 * 0.5:
        score = 4
    elif distance * 180 <= 7.5 * 1.5:
        score = 3
    elif distance * 180 <= 7.5 * 2.5:
        score = 2

    if score < 4:
        if difference < 0 and game_state['leftRight'] == 0:
            game_state['score'][1 - game_state['turn']] += 1
        elif difference > 0 and game_state['leftRight'] == 1:
            game_state['score'][1 - game_state['turn']] += 1

    game_state['score'][game_state['turn']] += score
    game_state['lastScore'] = score

    # TODO handle ties, sudden death (lots of work)
    if game_state['score'][0] >= 10 or game_state['score'][1] >= 10:
        game_state['complete'] = True

    socketio.emit('gameState', game_state, json=True, room=game_code)

@socketio.on('nextRound')
@active_game
def handle_next_round(game_state, game_code):
    if game_state['complete']:
        socketio.emit('gameState', game_state, json=True, room=game_code)
        return

    possible_clues = game_state['possibleClues']

    game_state['screenClosed'] = True
    game_state['targetPosition'] = random_target_pos()
 
    game_state['roundNum'] += 1

    # second turn, catch-up mechanic
    if not (game_state['lastScore'] >= 4 and game_state['score'][game_state['turn']] < game_state['score'][1 - game_state['turn']]):
        game_state['turn'] = 1 - game_state['turn']

    game_state['clueColor'] = random.randint(0, 19-1)
    
    if game_state['roundNum'] % len(possible_clues) == 0:
        random.shuffle(possible_clues)

    game_state['clues'] = possible_clues[game_state['roundNum'] % len(possible_clues)]

    socketio.emit('gameState', game_state, json=True, room=game_code)

@socketio.on('newGame')
@active_game
def handle_new_game(game_state, game_code):
    game_state = default_game_state()
    socketio.emit('gameState', game_state, json=True, room=game_code)

    return game_state

def get_or_create_state(game_code):
    global games
    print(game_code)

    if game_code in games:
        return games[game_code]
    else:
        new_state = default_game_state()
        games[game_code] = new_state
        return new_state


def random_target_pos():
    return random.uniform(0.05, 0.95)

def default_game_state():
    global possible_clues

    my_possible_clues = possible_clues[::]
    random.shuffle(my_possible_clues)

    return {
        'dialPosition': 0.5,
        'screenClosed': True,
        'targetPosition': random_target_pos(),
        'clues': my_possible_clues[0],
        'clueColor': random.randint(0, 19-1),
        'roundNum': 0,
        'score': [0, 1],
        'turn': 0,
        'lastScore': 0,
        'leftRight': 0,
        'complete': False,
        'possibleClues': my_possible_clues,
        'gameId': random.randint(1, 1000000)
    }

possible_clues = load_clues('wavelength.csv')

if __name__ == '__main__':
    socketio.run(app, port=8000)
