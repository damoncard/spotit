// Import //
	express = require('express')
	app = express()
	server = require('http').Server(app)
	io = require('socket.io')(server)
	path = require('path')

// Set variable //
	port = process.env.PORT || 3000
	player = 0
	timer = null
	status = 'offline'
	online = false
// Set environment
	server.listen(port)
	app.use('/static', express.static(__dirname + '/assets/prod'))
	app.disable('etag')
// Set route //
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/views/index.html')
	})

	app.get('/rNzX54tInH', function(req, res) {
		res.sendFile(__dirname + '/views/gm.html')
	})
	
// Socket.io
	var user = io.of('/').on('connection', function(socket) {
		socket.emit('id', socket.id)

		socket.on('enter', function(package) {
			if (player < 8) {
				switch (status) {
					case 'online':
						if (++player == 1) {
							stopCountdown()
						}
						admin.emit('joining', {name: package['key'], key: socket.id})
						socket.emit('status', {response: 'online'})
						break
					case 'offline':
						socket.emit('status', {response: 'offline'})
						break
					case 'running':
						socket.emit('status', {response: 'running'})
						break
				}
			} else {
				socket.emit('status', {response: 'full'})
			}
		})
		socket.on('ready', function(package) {
			admin.emit('ready', package)
		})
		socket.on('notready', function(package) {
			admin.emit('notready', package)
		})
		socket.on('choose', function(package) {
 			admin.emit('submit', package)
		})
		socket.on('disconnect', function(package) {
			admin.emit('leaving', {key: socket.id})
			if (player == 0) {
				startCountdown()
			}
		})
	})

	var admin = io.of('/tunnel').on('connection', function(socket) {
		status = 'online'

		socket.on('acknowledge', function(package) {
			user.emit('callback', package)
		})
		socket.on('gameStarted', function(package) {
			if (package == 'end') {
				started = 'online'
				user.emit('id')
			} else {
				started = 'running'
			}
		})
		socket.on('exit', function() {
			player--
		})
		socket.on('disconnect', function() {
			status = 'offline'
			user.emit('id')
		})
	})
// Others
	function startCountdown() {
		var countdown = 8 * 1000
		timer = setInterval(function(){
			countdown -= 1000;
			if (countdown <= 0) {
				clearInterval(timer)
				admin.emit('inactive')
			}
		}, 1000)
	}

	function stopCountdown() {
		clearInterval(timer)
	}

	console.log('Server starting on port: ' + port)