$(document).ready(function () {
    var list = {}
    var r_list = {}
    var s_list = {}
    var answer
    var remain = 6
    var player = 0
    var timer = null
    var ready = false
    var socket = io.connect('/tunnel')
    // ################# Initialize Phase ############### //
    socket.on('joining', function (token) {
        if (token['id'] != null) {
            list[token['id']] = token['name']
            s_list[token['id']] = 0
            r_list[token['id']] = false
            if (++player == 1) {
                setActive(true)
            }
            ready = false
            addToLobby(token['id'])
        }
    })
    socket.on('leaving', function (token) {
        if (list[token['id']] != null) {
            $('#' + token['id']).css('display', 'none')
            delete list[token['id']]
            delete s_list[token['id']]
            delete r_list[token['id']]
            player--
            socket.emit('exit')
        }
    })
    socket.on('inactive', function () {
        setActive(false)
    })
    function addToLobby(id) {
        $('#container').append(`<span style='margin-left: 50px; font-size: 0.5em; color: red;' id=` + id + `>` + list[id] + `</span>`)
    }
    function setActive(status) {
        if (status) {
            $('#container').empty()
            $('#container').append(`<p>Lobby</p><br><span style="font-size:0.7em;">Player List</span>`)
            createCountdown()
        } else {
            $('#container').empty()
            $('#container').append(`<p class='buzz'>Spot It</p>`)
        }
    }
    socket.on('status', function (obj) {
        if (obj['status'] == "ready") {
            r_list[token['id']] = true
            $('#' + token['id']).css('color', 'green')
            if (checkReady(r_list)) {
                ready = true
                $('#wrap').css('display', 'block')
                startCountdown()
            }
        } else if (obj['status'] == "not") {
            r_list[token['id']] = false
            $('#' + token['id']).css('color', 'red')
            ready = false
            $('#wrap').css('display', 'none')
        }
    })
    // ################ Playing Phase ################ //
    socket.on('submit', function (token) {
        if (answer.indexOf(token['value']) != -1 || answer.indexOf('hand') != -1) {
            var temp = answer
            $('#' + token['id']).text(++s_list[token['id']])
            if (nextPic()) {
                socket.emit('acknowledge', { id: token['id'], card: temp, result: 'true' })
            } else {
                showResult()
            }
        } else {
            socket.emit('acknowledge', { id: token['id'], card: null, result: 'false' })
        }
    })
    function nextPic() {
        if (remain-- > 0) {
            answer = pile[55 - remain]
            showPic(answer)
            return true
        }
        return false
    }
    function showResult() {
        var arr = showLeaderboard(s_list)
        var i = 1
        for (var a in arr) {
            $('body').append(`<center>
										<span class='score'>` + list[arr[a][0]] + `: </span>
										<span class='score'>` + arr[a][1] + `</span>
									   </center>`)
            socket.emit('acknowledge', { id: arr[a][0], rank: i++, result: 'end' })
        }
        setTimeout(function () {
            socket.emit('gameStarted', 'end')
            restartGame()
        }, 30000)
    }
    // ############################################# //
    function startCountdown() {
        $('body').css({ 'background-color': '#ffb84d' })
        var s = 5
        function countdown() {
            if (s < 0) {
                $('body').css({ 'background-color': '#e6e6e6' })
                $('#container').empty()
                //$('#container').removeAttr('class')
                init(player)
                var i = 0
                for (var id in list) {
                    socket.emit('acknowledge', { id: id, card: pile[i], result: 'none' })
                    i++
                }
                socket.emit('gameStarted', 'start')
                remain -= player
                showScores(list, s_list)
                nextPic()
                return
            }
            $('#wrap').removeAttr('class')
            setTimeout(function () {
                if (!ready) {
                    $('body').css({ 'background-color': '#e6e6e6' })
                    $('#wrap').css('display', 'none')
                    return
                }
                $('#wrap').addClass('wrap-' + s)
                setTimeout(function () {
                    s--
                    countdown()
                }, 1000)
            }, 600)
        }
        countdown()
    }
    function restartGame() {
        list = {}
        r_list = {}
        s_list = {}
        player = 0
        $('body').empty()
        $('body').append(`<div id='container' class='what'></div>`)
        setActive(false)
    }
})

function createCountdown() {
    $('#container').append(`<div id="wrap">
					<div class="c"></div>
					<div class="o"></div>
					<div class="u"></div>
					<div class="n"></div>
					<div class="t"></div>
			    </div>
			<svg style='display: none;'>
				<defs>
					<filter id="filter">
						<feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
						<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10" result="filter" />
						<feComposite in="SourceGraphic" in2="filter" operator="atop" />
					</filter>
				</defs>
			</svg>`)
    $('#wrap').css('display', 'none')
}

function checkReady(list) {
    for (var s in list) {
        if (!list[s]) {
            return false
        }
    }
    return true
}

function showScores(name, score) {
    for (var k in name) {
        $('body').append(`<span class='score'>` + name[k] + `: </span><span id='` + k + `' class='score'>` + score[k] + `</span><br>`)
    }
}

function showLeaderboard(score) {
    var i = 1
    var sortable = []
    $('body').empty()
    $('body').append(`<center><p>Leaderboard</p><center>`)

    for (var s in score) {
        sortable.push([s, score[s]])
    }
    sortable.sort(function (a, b) { return b[1] - a[1] })
    return sortable
}