// Import //
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var middleware = require('socketio-wildcard')();
var path = require('path')

// Set variable //
var port = process.env.PORT || 8080
var timer = null
var status = 'offline'

// Set environment
server.listen(port)
app.use('/static', express.static(__dirname + '/assets/prod'))
app.disable('etag')
io.use(middleware)

// Set route //
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/player.html')
})

app.get('/tunnel', function (req, res) {
	res.sendFile(__dirname + '/views/gm.html')
})

// Socket.io
var user = io.of('/').on('connection', function (socket) {
	socket.emit('id', socket.id)

	socket.on('*', function (obj) {
		var event = obj.data[0]
		var value = obj.data[1]
		switch (event) {
			case 'enter':
				if (player < 8) {
					if (status == 'online') {
						if (player == 1) {
							stopCountdown()
						}
						admin.emit('joining', { name: value, id: socket.id })
					}
					socket.emit('status', { response: status })
				} else {
					socket.emit('status', { response: 'full' })
				}
				break
			case 'status':
				admin.emit('status', {id: value['id'], status: value['status'], player: player })
				break
			case 'submit':
				admin.emit('submit', value)
				break
		}
	})

	socket.on('disconnect', function () {
		admin.emit('leaving', { id: socket.id })
		if (--player == 0) {
			startCountdown()
		}
	})
})

var admin = io.of('/tunnel').on('connection', function (socket) {
	status = 'online'
	player = io.engine.clientsCount - 1

	socket.on('*', function (obj) {
		var event = obj.data[0]
		var value = obj.data[1]
		switch (event) {
			case 'callback':
				user.emit('callback', value)
				break
			case 'status':
				if (value == 'end') {
					status = 'online'
					user.emit('id')
				} else {
					status = 'running'
				}
				break
		}
	})

	socket.on('disconnect', function () {
		status = 'offline'
		user.emit('id')
	})
})
// Others
function startCountdown() {
	var countdown = 8 * 1000
	timer = setInterval(function () {
		countdown -= 1000;
		if (countdown <= 0) {
			admin.emit('inactive')
			clearInterval(timer)
		}
	}, 1000)
}

function stopCountdown() {
	clearInterval(timer)
}

console.log('Server starting on port: ' + port)