var state = {};

var isx;

var is_locked = false;
        
function symbol(value) {
    return value ? 'X' : 'O';
}

function set_state_at(cell, s) {
    if (state[cell]) { return false; }
    state[cell] = s;
    var cells = Array.from(document.querySelector('#Content').children);
    cells.filter(e => e.dataset.cell === cell)[0].textContent = s;
    return true;
}

function init_listeners(socket) {
    Array.from(document.querySelector('#Content').children).forEach(e =>
        e.addEventListener('click', function () {
            if (is_locked) { return; }
            socket.emit('place', e.dataset.cell);
            if (set_state_at(e.dataset.cell, symbol(isx))) {
                is_locked = true;
            }
        })
    );

    socket.on('symbol', function (value) {
        isx = value;
    });

    socket.on('place', function (cell) {
        if (set_state_at(cell, symbol(!isx))) {
            is_locked = false;
        }
    });
}

function init_socket() {
    var socket = io.connect('http://' + document.domain + ':' + location.port);
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
