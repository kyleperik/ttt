var state = {};

var isx;

var is_locked = true;

function range(start, end, step) {
    var _end = end || start;
    var _start = end ? start : 0;
    var _step = step || 1;
    return Array((_end - _start) / _step).fill(0).map((v, i) => _start + (i * _step));
}

function symbol(value) {
    return value ? '×' : '○';
}

function get_result(i, handlers) {
    if (handlers.length === 0) return null;
    if (handlers[0]()) return i;
    return get_result(i + 1, handlers.splice(1));
}

function set_state_at(cell, s) {
    if (state[cell] !== undefined) { return false; }
    state[cell] = s;
    var cells = Array.from(document.querySelector('#Content').children);
    cells.filter(e => e.dataset.cell === cell)[0].textContent = symbol(s);
    var checks = [
        () => check_win(isx),
        () => check_win(!isx),
        () => Object.keys(state).length === 9
    ];
    var result = get_result(0, checks);
    if (result != null) {
        var message = [
            'You Won!',
            'You Lost :(',
            'Draw!'
        ][result];
        document.getElementById('Block').style.display = '';
        document.getElementById('Block').textContent = message;
        game_finished = true;
    }
    return true;
}

function piece_at(x, y) {
    return state[x + y * 3];
}

function check_win(s) {
    var rows = 3;
    return range(rows).some(i => 
        range(rows).every(j => piece_at(j, i) === s) ||
        range(rows).every(j => piece_at(i, j) === s)
    ) || range(rows).every(i => piece_at(i, i) === s) ||
        range(rows).every(i => piece_at(rows - i - 1, i) === s);
}

function init_listeners(socket) {
    Array.from(document.querySelector('#Content').children).forEach(e =>
        e.addEventListener('click', function () {
            if (is_locked) { return; }
            socket.emit('place', e.dataset.cell);
            if (set_state_at(e.dataset.cell, isx)) {
                is_locked = true;
            }
        })
    );

    socket.on('game_disconnected', function () {
        if (!game_finished) {
            document.getElementById('Block').textContent = 'Opponent disconnected :(';
            document.getElementById('Block').style.display = '';
            is_locked = true;
        }
    });
    
    socket.on('symbol', function (value) {
        isx = value;
    });
    
    socket.on('start_game', function () {
        document.getElementById('Block').style.display = 'none';
        is_locked = false;
    });
    
    socket.on('place', function (cell) {
        if (set_state_at(cell, !isx)) {
            is_locked = false;
        }
    });
    
    window.addEventListener('beforeunload', function () {
        socket.disconnect();
    });
    
    window.socket = socket;
}

function init_socket() {
    var socket = io.connect(location.href);
    init_listeners(socket);
    return new Promise(function (resolve, reject) {
        socket.on('connect', function() {
            resolve(socket);
        });
    });
}

window.addEventListener('load', function () {
    init_socket();
});
