var React = require('react');
var ReactDOM = require('react-dom');
var io = require('socket.io-client')
var socket = io('/tunnel')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

$(document).ready(function () {
    var list = {}
    var remain = 6
    var player = 0
    var timer = null

    socket.on('*', function (obj) {
        var event = obj.data[0]
        var value = obj.data[1]
        switch (event) {
            // ################# Initialize Phase ############### //
            case 'joining':
                if (value['id'] != null) {
                    list[value['id']] = {
                        name: value['name'],
                        score: 0,
                        status: false,
                    }
                    if (++player == 1) {
                        initContainer.setState({ active: true })
                    }
                    initContainer.setState({ list: list })
                }
                break
            case 'leaving':
                if (list[value['id']] != null) {
                    delete list[value['id']]
                    initContainer.setState({ list: list })
                    player--
                    socket.emit('exit')
                }
                break
            case 'inactive':
                initContainer.setState({ active: false })
                break
            case 'status':
                var id = value['id']
                var status = value['status'] == 'ready' ? true : false
                list[id].status = status
                $('#' + id).css('color', status ? 'green' : 'red')

                var all_ready = false
                for (var i in list) {
                    if (!list[i].status) {
                        all_ready = false
                        break
                    }
                }

                if (all_ready) {
                    $('.countdown-container').show()
                    startCountdown()
                } else {
                    $('.countdown-container').hide()
                }
                break
            // ################ Playing Phase ################ //
            case 'submit':
                
                if (nextPic()) {
                    socket.emit('acknowledge', { id: value['id'], card: temp, result: 'true' })
                } else {
                    showResult()
                }
                socket.emit('acknowledge', { id: value['id'], card: null, result: 'false' })
                break
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
            list = {}
            player = 0
            reRenderComponent(<InitContainer />)
        }, 30000)
    }
    // ############################################# //
    function startCountdown() {
        var s = 5
        function countdown() {
            if (s < 0) {
                $('#container').empty()
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
            $('.countdown-container').show()
            setTimeout(function () {
                if (!ready) {
                    $('.countdown-container').hide()
                    return
                }
                $('.countdown-timer').addClass('wrap-' + s)
                setTimeout(function () {
                    s--
                    countdown()
                }, 1000)
            }, 600)
        }
        countdown()
    }

    ReactDOM.render(<InitContainer />, $('.admin-container'))
})

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

var initContainer = class InitContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            active: false,
            list: [],
        }
    }

    render() {
        return (
            <div className='init-container'>
                {this.state.active ? (
                    <div>
                        <div className='lobby-room'>
                            <p>Lobby</p><br />
                            <span style='font-size:0.7em;'>Player List</span>
                            {this.state.list.map(function (player) {
                                <span id={player.id} style={{ 'margin-left': '50px', 'font-size': '0.5em', 'color': 'red' }}>{player.name}</span>
                            })}
                        </div>

                        <div className='countdown-container' style={{ 'display': 'none' }}>
                            <div id='countdown-timer'>
                                <div className='c'></div>
                                <div className='o'></div>
                                <div className='u'></div>
                                <div className='n'></div>
                                <div className='t'></div>
                            </div>
                            <svg style='display: none;'>
                                <defs>
                                    <filter id='filter'>
                                        <feGaussianBlur in='SourceGraphic' stdDeviation='18' result='blur' />
                                        <feColorMatrix in='blur' mode='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10' result='filter' />
                                        <feComposite in='SourceGraphic' in2='filter' operator='atop' />
                                    </filter>
                                </defs>
                            </svg>
                        </div>
                    </div>
                ) : (
                        <div>
                            <p class='game-label'>Spot It</p>
                        </div>
                    )}
            </div>
        )
    }
}

var stageContainer = class StageContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            list: [],
            cards: [],
        }
    }


    render() {
        return (
            <div className='stage-container'>
                <p className='score-label'>Your Score: <span className='score-label'>{this.state.score}</span></p>
                <p className='ban-label' style={{ 'display': 'none' }}>You got TEMPORALLY banned, from picking the wrong one</p>
                {this.state.cards.map(function (card) {
                    <img height='100px' src={getPic(card)} value={card} />
                })}
            </div>
        )
    }

}

var rankContainer = class RankContainer extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>

            </div>
        )
    }
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode($('.admin-containter'))
    ReactDOM.render(component, $('.admin-container'))
}