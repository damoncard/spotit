// Import //
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server, {'pingInterval': 1000, 'pingTimeout': 2000})
var path = require('path')
var status = 'offline'

// Set environment
app.use('/static', express.static(__dirname + '/assets/prod'))
app.disable('etag')
server.listen(3333)
console.log('Server starting on port: ' + 3333)

// Set route
app.get('/play', function (req, res) {
	res.sendFile(__dirname + '/views/player.html')
})

app.get('/tunnel', function (req, res) {
	res.sendFile(__dirname + '/views/gm.html')
})

// Socket.io
const user = io.of('/player').on('connection', function (socket) {
	socket.on('ready', function () {
		socket.emit('setup', { id: socket.client.id, refresh: false})
	})

	socket.on('enter', function (obj) {
		if (status == 'online') {
			admin.emit('joining', obj)
		}
		socket.emit('status', { response: status })
	})

	socket.on('change-name', function () {
		admin.emit('leaving', { id: socket.client.id })
	})

	socket.on('status', function (obj) {
		admin.emit('status', obj)
	})

	socket.on('submit', function (obj) {
		admin.emit('submit', obj)
	})

	socket.on('disconnect', function () {
		admin.emit('leaving', { id: socket.client.id })
	})
})

const admin = io.of('/admin').on('connection', function (socket) {
	status = 'online'

	socket.on('loading', function() {
		user.emit('loading')
	})

	socket.on('result', function (obj) {
		user.emit('result', obj)
	})

	socket.on('status', function (obj) {
		if (obj == 'end') {
			user.emit('setup', { refresh: true })
			status = 'online'
		}
		else if (obj == 'out') {
			user.emit('setup', { refresh: false })
			status = 'online'
		} else {
			status = obj
		}
	})

	socket.on('disconnect', function () {
		status = 'offline'
		user.emit('setup', { refresh: false })
	})
})