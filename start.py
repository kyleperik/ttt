from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
import redis

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secretfjasd'
io = SocketIO(app)
db = redis.StrictRedis(host='localhost', port=6379, db=1)

@io.on('connect')
def connect():
    open_room = db.get('open_room')
    last_room = db.get('last_room')
    room = int(open_room) if open_room else int(last_room) + 1 if last_room else 0
    join_room(room)
    print(f'{request.sid} - connected - joining {room}')
    if open_room:
        db.delete('open_room')
        emit('symbol', True, room=request.sid)
        emit('start_game', room=room)
    else:
        emit('symbol', False, room=request.sid)
        db.set('open_room', room)
        if not last_room:
            db.set('last_room', room)
        else:
            db.incr('last_room')

@io.on('disconnect')
def disconnect():
    room = [room for room in rooms() if room != request.sid][0]
    open_room = db.get('open_room')
    if open_room and int(open_room) == room:
    	db.delete('open_room')
    print(f'{request.sid} - disconnected')
    emit('game_disconnected', room=room)
        
@io.on('place')
def place(cell):
    room = [room for room in rooms() if room != request.sid][0]
    print(f'{request.sid} - place - {cell} - notifing - {room}')
    emit('place', cell, room=room)

@app.route('/')
def index():
    return render_template('index.jinja')

if __name__ == '__main__':
    io.run(app, host='0.0.0.0', port=8090)
