var React = require('react');
var ReactDOM = require('react-dom');
var io = require('socket.io-client')
var socket = io('/tunnel')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

$(document).ready(function () {
    var list = {}
    var player = 0
    var remain = 6
    var all_ready = false

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

                for (var i in list) {
                    if (list[i].status) {
                        all_ready = true
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
                var result = false
                var answer = stageContainer.state.cards
                var player_choice = value['value']

                if (answer.indexOf(player_choice) != -1 || answer.indexOf('hand') != -1) {
                    result = true
                }

                if (result) {
                    if (nextPic()) {
                        list[value['id']].score++
                        stageContainer.setState({ list: list })                        
                        socket.emit('acknowledge', { id: value['id'], card: answer, result: 'true' })
                    } else {
                        sortScore()
                        reRenderComponent(<RankContainer list={list} />)
                    }
                } else {
                    socket.emit('acknowledge', { id: value['id'], card: null, result: 'false' })
                }
                break
        }
    })

    ReactDOM.render(<InitContainer />, $('.admin-container'))
})

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
                        <div className='center'>
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
                <div className='player-panel'>
                    {this.state.list.map(function (player) {
                        <div className='player-profile'>
                            <span className='player-name'>{player.name}</span>
                            <span id={player} className='player-score'>{player.score}</span>
                        </div>
                    })}
                </div>
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
        this.state.list = props.list
    }

    componentDidMount() {
        var rank = 1
        for (var i in this.state.list) {
            socket.emit('acknowledge', { id: list[i], rank: rank++, result: 'end' })
        }

        setTimeout(function () {
            socket.emit('gameStarted', 'end')
            list = {}
            player = 0
            reRenderComponent(<InitContainer />)
        }, 30000)
    }

    render() {
        return (
            <div className='center'>
                <p>Leaderboard</p>
                {this.state.list.map(function (player, index) {
                    <div className='rank-profile'>
                        <span className='rank-label'>{index}</span>
                        <span className='player-name'>{player.name}</span>
                    </div>
                })}
            </div>
        )
    }
}

function nextPic() {
    if (remain-- > 0) {
        var cards = pile[55 - remain]
        stageContainer.setState({ cards: cards })
        return true
    }
    return false
}

function sortScore() {
    var sortable = []
    for (var s in list) {
        sortable.push([s, list[s].score])
    }
    sortable.sort(function (a, b) { return b[1] - a[1] })
    list = sortable
}

function startCountdown() {
    var second = 5
    function countdown() {
        if (second < 0) {
            init(player)

            var i = 0
            for (var id in list) {
                socket.emit('acknowledge', { id: id, card: pile[i], result: 'none' })
                i++
            }

            reRenderComponent(<stageContainer />)
            socket.emit('gameStarted', 'start')
            remain -= player
            nextPic()
            return
        }
        $('.countdown-container').show()
        setTimeout(function () {
            if (!all_ready) {
                $('.countdown-container').hide()
            } else {
                $('.countdown-timer').addClass('wrap-' + second)
                setTimeout(function () {
                    second--
                    countdown()
                }, 1000)
            }
        }, 600)
    }
    countdown()
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode($('.admin-containter'))
    ReactDOM.render(component, $('.admin-container'))
}