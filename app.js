// Import //
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var middleware = require('socketio-wildcard')();
var path = require('path')
var status = 'offline'
var player = 0

// Set environment
app.use('/static', express.static(__dirname + '/assets/prod'))
app.disable('etag')
io.use(middleware)
server.listen(8080)
console.log('Server starting on port: ' + 8080)

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
						player++
						admin.emit('joining', { name: value, id: socket.id })
					}
					socket.emit('status', { response: status })
				} else {
					socket.emit('status', { response: 'full' })
				}
				break
			case 'status':
				admin.emit('status', { id: value['id'], status: value['status']})
				break
			case 'submit':
				admin.emit('submit', value)
				break
		}
	})

	socket.on('disconnect', function () {
		admin.emit('leaving', { id: socket.id })
		player--
	})
})

var admin = io.of('/tunnel').on('connection', function (socket) {
	status = 'online'
	player = io.engine.clientsCount - 1

	socket.on('callback', function (obj) {
		user.emit('callback', obj)
	})

	socket.on('status', function (obj) {
		if (obj == 'end') {
			status = 'online'
			user.emit('id')
		} else {
			status = 'running'
		}
	})

	socket.on('disconnect', function () {
		status = 'offline'
		user.emit('id')
	})
})