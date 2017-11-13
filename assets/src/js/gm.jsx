var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/admin')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

import { pile, patterns, initGame } from './pile.jsx'

var reactComponent
var timer
var delay
var list = {}
var remain
var game_running = false
var all_ready = false

$(document).ready(function () {
    socket.on('*', function (obj) {
        var event = obj.data[0]
        var value = obj.data[1]
        switch (event) {
            // ################# Initialize Phase ############### //
            case 'joining':
                if (value['id'] != null) {
                    if (Object.keys(list).length == 7) {
                        socket.emit('status', 'full')
                    }
                    list[value['id']] = {
                        name: value['name'],
                        score: 0,
                        status: false,
                        trophy: false,
                        online: true,
                    }
                    all_ready = false
                    $('.countdown-container').hide()
                    $('.countdown-modal').hide()
                    $('#countdown-timer').removeClass()
                    reactComponent.setState({ active: true })
                    reactComponent.setState({ list: list })
                }
                break
            case 'leaving':
                if (list[value['id']] != null) {
                    if (game_running) {
                        list[value['id']].online = false
                        reactComponent.setState({ list: list })
                        var all_offline = checkOffline()
                    } else {
                        delete list[value['id']]
                        reactComponent.setState({ list: list })
                        checkStatus()
                    }
                    if (Object.keys(list).length == 0 || all_offline) {
                        var countdown = 5
                        clearInterval(timer)
                        timer = setInterval(function () {
                            if (Object.keys(list).length == 0  || all_offline) {
                                countdown--
                                if (countdown == 0) {
                                    for (var id in list) {
                                        delete list[id]
                                    }
                                    if (reactComponent.state.active == null) {
                                        socket.emit('status', 'out')
                                        reRenderComponent(<InitContainer />)
                                    } else {
                                        reactComponent.setState({ active: false })
                                    }
                                    clearInterval(timer)
                                }
                            }
                        }, 1000)
                    }
                }
                break
            case 'inactive':
                reactComponent.setState({ active: false })
                break
            case 'status':
                var id = value['id']
                var status = value['status'] == 'ready' ? true : false
                list[id].status = status
                reactComponent.setState({ list: list })
                checkStatus()
                break
            // ################ Playing Phase ################ //
            case 'submit':
                var result = false
                var answer = reactComponent.state.cards
                var player_choice = value['value']

                if (answer.map(function (e) { return e.name; }).indexOf(player_choice) != -1) {
                    result = true
                }

                if (result) {
                    list[value['id']].score++
                    if (player_choice == 'trophy') {
                        reactComponent.trophyTaken(value['id'])
                    }
                    if (nextPic()) {
                        socket.emit('result', { id: value['id'], card: answer, result: 'true' })
                    } else {
                        var trophy = $('#trophy-pos').data('pos')
                        var scores = []
                        if (trophy != 0) {
                            var id = $('ul > li:nth-child(' + trophy + ') > .player-no').data('id')
                            list[id].score += 5
                            list[id].trophy = true
                        }

                        for (var id in list) {
                            if (scores.indexOf(list[id].score) == -1) {
                                scores.push(list[id].score)
                            }
                        }

                        scores.sort(function (a, b) { return b - a })

                        for (var id in list) {
                            var rank = scores.indexOf(list[id].score) + 1
                            var color = $('#' + id).parent().children('.player-no').css('background-color')
                            socket.emit('result', { id: id, rank: rank, color: color, result: 'end' })
                        }

                        reRenderComponent(<RankContainer list={list} />)
                    }
                } else {
                    socket.emit('result', { id: value['id'], card: null, result: 'false' })
                }
                break
        }
    })

    reactComponent = ReactDOM.render(<InitContainer />, document.querySelector('.admin-container'))
})




class InitContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            active: false,
            list: [],
        }
    }

    componentDidMount() {
        var bubble = 0
        var second = 0
        $('.bubbles').append('<li></li>')
        $('.bubbles').append('<li></li>')
        $('.bubbles').append('<li></li>')
        var launcher = setInterval(function () {
            second++
            if (second == 12) {
                clearInterval(launcher)
            }
            if (second == 1 || second == 2 || second == 3 || second == 6 || second == 11) {
                $('.bubbles').append('<li></li>')
                if (second == 3 || second == 11) {
                    $('.bubbles').append('<li></li>')
                }
            }
        }, 1000)
    }

    render() {
        return (
            <div className='init-container'>
                {this.state.active ? (
                    <div className='lobby-room'>
                        <div className='lobby-board'>
                            <div className='lobby-header'>
                                <p className='lobby-text'>Lobby</p>
                                <p className='list-header'>Player List</p>
                            </div>
                            <div className='list-box'>
                                <table>
                                    <thead>
                                        <th><span>Player Name</span></th>
                                        <th><span>Status</span></th>
                                    </thead>
                                    <tbody>
                                        {Object.keys(this.state.list).map((player) => {
                                            return (
                                                <tr id={player}>
                                                    {this.state.list[player].status ? (
                                                        <td className='player-pane ready'>
                                                            <p className='player-name'>{this.state.list[player].name}</p>
                                                        </td>
                                                    ) : (
                                                            <td className='player-pane non-ready'>
                                                                <p className='player-name'>{this.state.list[player].name}</p>
                                                            </td>
                                                        )}

                                                    {this.state.list[player].status ? (
                                                        <td className='status-pane ready'>
                                                            <i className='fa fa-check'></i>
                                                        </td>
                                                    ) : (
                                                            <td className='status-pane non-ready'>
                                                                <i className='fa fa-times'></i>
                                                            </td>
                                                        )}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className='countdown-container' style={{ 'display': 'none' }}>
                            <div id='countdown-timer'>
                                <div className='c'></div>
                                <div className='o'></div>
                                <div className='u'></div>
                                <div className='n'></div>
                                <div className='t'></div>
                            </div>
                            <svg>
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
                            <p className='game-label'>Spot it</p>
                        </div>
                    )}
                <ul className='bubbles'></ul>
                <div className='footer'>
                    <p className='credit'>CS15@SIT-KMUTT</p>
                </div>
            </div>
        )
    }
}

class StageContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            list: props.list,
            cards: [],
        }
    }

    updatePic(cards) {
        this.props.remain--
        this.setState({ cards: cards })

        var index = 0
        $('.cards-panel').find('img').each(function() {
            var animation = Math.random() * 10 > 5 ? 'rotating-front ' : 'rotating-back '
            var style = {
                position: 'absolute',
                top: cards[index].top + '%',
                left: cards[index].left + '%',
                width: cards[index].width + '%',
                animation: animation + ((Math.random() * 10) + 1) + 's linear infinite'
            }
            $(this).css(style)
            index++
        })
    }

    trophyTaken(id) {
        var player = parseInt($('#' + id).parent().children('.player-no').text())
        var pixel = player * 60
        if (player <= 3) {
            pixel += 12
        } else {
            pixel += 17
        }
        $('.trophy-token').css('transform', 'translateY(' + pixel + 'px)')
        $('#trophy-pos').data('pos', player)
    }

    render() {
        return (
            <div className='stage-container'>
                <div className='remain-indicator'>
                    <p className='remain-header'>Remaining Cards</p>
                    <p className='remain-no'>{this.props.remain}</p>
                </div>
                <div className='player-panel'>
                    <p className='player-header'>
                        <span>L</span>
                        <span>e</span>
                        <span>a</span>
                        <span>d</span>
                        <span>e</span>
                        <span>r</span>
                        <span>b</span>
                        <span>o</span>
                        <span>a</span>
                        <span>r</span>
                        <span style={{ 'margin-right': '30px' }}>d</span>
                    </p>
                    <ul>
                        {Object.keys(this.state.list).map((player, index) => {
                            var online = this.state.list[player].online
                            return (
                                index % 2 == 0 ? (
                                    <li style={{ 'background-color': '#fdb4bf' }}>
                                        {!online && <span className='player-offline'></span>}
                                        <span className='player-no' data-id={player}>{index + 1}</span>
                                        <span className='player-name'>{this.state.list[player].name}</span>
                                        <span id={player} className='player-score'>{this.state.list[player].score}</span>
                                    </li>
                                ) : (
                                        <li style={{ 'background-color': '#ffdddd' }}>
                                            {!online && <span className='player-offline'></span>}
                                            <span className='player-no' data-id={player}>{index + 1}</span>
                                            <span className='player-name'>{this.state.list[player].name}</span>
                                            <span id={player} className='player-score'>{this.state.list[player].score}</span>
                                        </li>
                                    )
                            )
                        })}
                    </ul>
                    <img src='static/pic/trophy.svg' className='trophy-token' />
                </div>
                <div className='cards-panel'>
                    {this.state.cards.map((card) => {
                        return (
                            <img src={'static/pic/' + card.name + '.svg'} value={card.name} />
                        )
                    })}
                </div>
                <input type='hidden' id='trophy-pos' data-pos='0' />
            </div>
        )
    }
}

class RankContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            list: props.list,
        }
    }

    componentDidMount() {
        $('.score-block').each(function () {
            $(this).find('.score-bar').animate({
                width: $(this).attr('data-percent')
            }, 4000);
        })

        setTimeout(function () {
            socket.emit('status', 'end')

            for (var id in list) {
                if (list[id].online) {
                    list[id].score = 0
                    list[id].status = false
                    list[id].trophy = false
                } else {
                    delete list[id]
                }
            }

            game_running = false
            reRenderComponent(<InitContainer />)
            reactComponent.setState({ active: true })
            reactComponent.setState({ list: list })
        }, 15000)
    }

    render() {
        return (

            <div className='rank-container'>
                <p className='rank-header'>Leaderboard</p>
                <div className='player-list'>
                    {Object.keys(this.state.list).map((player, index) => {
                        var num_player = Object.keys(list).length
                        var max_score = Math.floor(num_player * 6.8) - num_player
                        for (var id in list) {
                            if (list[id].trophy) {
                                max_score += 5
                                break
                            }
                        }
                        var percent = list[player].score / max_score * 100
                        return (
                            // {list[player].trophy && <img src='static/pic/trophy.svg' className='trophy-token' />}
                            <div className='rank-profile'>
                                <div className='title-container'>
                                    <span>{list[player].name}</span>
                                </div>
                                <div className='score-container'>
                                    <div className='score-block' data-percent={percent + '%'}>
                                        <div className='score-bar'></div>
                                        <span className='score-indicator'>{list[player].score}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

function startCountdown() {
    var second = 5
    clearInterval(timer)
    timer = setInterval(function () {
        if (all_ready) {
            $('#countdown-timer').removeClass()
            $('#countdown-timer').addClass('second-' + second)
            if (second-- < 0) {
                $('.countdown-modal').hide()
                for (var id in list) {
                    list[id].status = false
                }
                remain = Math.floor(Object.keys(list).length * 6.8)
                initGame()
                game_running = true
                for (var id in list) {
                    // var selected = Math.floor(Math.random() * 7)
                    var card = pile[remain--]
                    var pattern = patterns[0]
                    var set = []
                    for (var i in card) {
                        set[i] = {
                            name: card[i],
                            top: pattern[i].top,
                            left: pattern[i].left,
                            width: pattern[i].width
                        }
                    }
                    socket.emit('result', { id: id, card: set, result: 'none' })
                }
                reRenderComponent(<StageContainer list={list} remain={remain} />)
                nextPic()
                socket.emit('status', 'running')
                clearInterval(timer)
            }
        } else {
            $('#countdown-timer').removeClass()
            clearInterval(timer)
        }
    }, 1000)
}

function nextPic() {
    if (remain > 0) {
        var card = pile[remain--]
        var pattern = patterns[0]

        for (var i in card) {
            var j = parseInt(Math.random() * i)
            var x = card[i]
            card[i] = card[j]
            card[j] = x
        }

        var set = []

        for (var i in card) {
            set[i] = {
                name: card[i],
                top: pattern[i].top,
                left: pattern[i].left,
                width: pattern[i].width
            }
        }

        reactComponent.updatePic(set)
        return true
    }
    return false
}

function checkStatus() {
    for (var id in list) {
        if (list[id].status) {
            all_ready = true
            continue
        }
        all_ready = false
        break
    }

    if (all_ready && Object.keys(list).length != 0) {
        delay = setTimeout(function () {
            $('.countdown-container').fadeIn(200)
            $('.countdown-modal').fadeIn(200)
            startCountdown()
        }, 1000)
    } else {
        clearTimeout(delay)
        $('.countdown-container').fadeOut(200)
        $('.countdown-modal').fadeOut(200)
        $('#countdown-timer').removeClass()
    }
}

function checkOffline() {
    for (var id in list) {
        if (list[id].online) {
            return false
        }
    }
    return true
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode(document.querySelector('.admin-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.admin-container'))
}