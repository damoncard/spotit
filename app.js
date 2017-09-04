// Import //
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var path = require('path')
var status = 'offline'
var player = 0

// Set environment
app.use('/static', express.static(__dirname + '/assets/prod'))
app.disable('etag')
server.listen(8080)
console.log('Server starting on port: ' + 8080)

// Set route
app.get('/play', function (req, res) {
	res.sendFile(__dirname + '/views/player.html')
})

app.get('/tunnel', function (req, res) {
	res.sendFile(__dirname + '/views/gm.html')
})

// Socket.io
const user = io.of('/player').on('connection', function (socket) {
	socket.emit('id', socket.client.id)
	player++

	socket.on('enter', function (obj) {
		if (player <= 8) {
			if (status == 'online') {
				admin.emit('joining', obj)
			}
			socket.emit('status', { response: status })
		} else {
			socket.emit('status', { response: 'full' })
		}
	})

	socket.on('status', function (obj) {
		admin.emit('status', obj)
	})

	socket.on('submit', function (obj) {
		admin.emit('submit', obj)

	})

	socket.on('disconnect', function () {
		admin.emit('leaving', { id: socket.id })
		player--
	})
})

const admin = io.of('/admin').on('connection', function (socket) {
	status = 'online'

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

	setTimeout(sendHeartbeat, 25000);

	function sendHeartbeat() {
		setTimeout(sendHeartbeat, 25000);
		socket.emit('ping');
	}
})