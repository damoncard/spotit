var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/admin')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);
socket.heartbeatTimeout = 20000;

import { pile, patterns, initGame } from './pile.jsx'

var reactComponent
var timer
var list = {}
var remain = 3 // default: 55
var all_ready = false

$(document).ready(function () {

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
                    delete list[value['id']]
                    reactComponent.setState({ list: list })

                    if (Object.keys(list).length == 0) {
                        var countdown = 5
                        clearInterval(timer)
                        timer = setInterval(function () {
                            if (Object.keys(list).length == 0) {
                                countdown--
                                if (countdown == 0) {
                                    if (reactComponent.state.active == null) {
                                        socket.emit('status', 'end')
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
                $('#' + id).css('color', status ? 'green' : 'red')

                for (var i in list) {
                    if (list[i].status) {
                        all_ready = true
                        continue
                    }
                    all_ready = false
                    break
                }

                if (all_ready) {
                    $('.countdown-container').show()
                    $('.countdown-modal').show()
                    startCountdown()
                } else {
                    $('.countdown-container').hide()
                    $('#countdown-timer').removeClass()
                    $('.countdown-modal').hide()
                }
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
                        reactComponent.setState({ list: list })
                        socket.emit('callback', { id: value['id'], card: answer, result: 'true' })
                    } else {
                        var sorted_list = Object.keys(list).sort(function (a, b) { return list[b].score - list[a].score })

                        for (var i in sorted_list) {
                            socket.emit('callback', { id: sorted_list[i], rank: parseInt(i) + 1, result: 'end' })
                        }

                        reRenderComponent(<RankContainer list={sorted_list} />)
                    }
                } else {
                    socket.emit('callback', { id: value['id'], card: null, result: 'false' })
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

    render() {
        return (
            <div className='init-container'>
                {this.state.active ? (
                    <div>
                        <div className='lobby-room'>
                            <div className='lobby-header'>
                                <p>Lobby</p>
                            </div>
                            <div className='lobby-list'>
                                <p className='list-header'>Player List</p>
                                <div className='list-box'>
                                    {Object.keys(this.state.list).map((player) => {
                                        return (
                                            <p id={player} className='player-name' style={{ 'color': 'red' }}>{this.state.list[player].name}</p>
                                        )
                                    })}
                                </div>
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
                            <p className='game-label'>Spot It</p>
                        </div>
                    )}
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
            cards: props.cards,
        }
    }

    componentDidMount() {
        $('.cards-panel > img').each(function () {
            var top = $(this).data('top')
            var left = $(this).data('left')
            var height = $(this).data('height')
            var animation = Math.random() * 10 > 5 ? 'rotating-front ' : 'rotating-back '
            $(this).css({
                position: 'absolute',
                top: top + '%',
                left: left + '%',
                height: height + '%',
                animation: animation + ((Math.random() * 10) + 1) + 's linear infinite'
            })
        })
    }

    componentDidUpdate() {
        $('.cards-panel > img').each(function () {
            var top = $(this).data('top')
            var left = $(this).data('left')
            var height = $(this).data('height')
            var animation = Math.random() * 10 > 5 ? 'rotating-front ' : 'rotating-back '
            $(this).css({
                position: 'absolute',
                top: top + '%',
                left: left + '%',
                height: height + '%',
                animation: animation + ((Math.random() * 10) + 1) + 's linear infinite'
            })
        })
    }

    trophyTaken(id) {
        var pos = parseInt($('.trophy-token').data('pos'))
        var player = parseInt($('#' + id).parent().children('.player-no').text())
        var pixel = (player - pos) * 56
        if (pos == 0) {
            pixel += 14 // -70 for first player pos +56 for later player
            $('.trophy-token').css('transform', 'translateY(' + pixel + 'px) 1s ease-in')
        } else {
            $('.trophy-token').css('transform', 'translateY(' + pixel + 'px) 1s ease-in')
        }
        $('.trophy-token').attr('data-pos', player + '')
    }

    render() {
        return (
            <div className='stage-container'>
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
                        <span style={{ 'margin-right': '40px' }}>d</span>
                    </p>
                    <ul>
                        {Object.keys(this.state.list).map((player, index) => {
                            return (
                                index % 2 == 0 ? (
                                    <li style={{ 'background-color': '#fdb4bf' }}>
                                        <span className='player-no'>{index + 1}</span>
                                        <span className='player-name'>{this.state.list[player].name}</span>
                                        <span id={player} className='player-score'>{this.state.list[player].score}</span>
                                    </li>
                                ) : (
                                        <li style={{ 'background-color': '#ffdddd' }}>
                                            <span className='player-no'>{index + 1}</span>
                                            <span className='player-name'>{this.state.list[player].name}</span>
                                            <span id={player} className='player-score'>{this.state.list[player].score}</span>
                                        </li>
                                    )
                            )
                        })}
                    </ul>
                    <img src='static/pic/trophy.svg' data-pos='0' className='trophy-token' />
                </div>
                <div className='cards-panel'>
                    {this.state.cards.map((card) => {
                        return (
                            <img src={'static/pic/' + card.name + '.svg'} data-top={card.top} data-left={card.left} data-height={card.height} value={card.name} />
                        )
                    })}
                </div>
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
        setTimeout(function () {
            socket.emit('status', 'end')
            list = {}
            remain = 20
            reRenderComponent(<InitContainer />)
        }, 10000)
    }

    render() {
        return (
            <div className='center'>
                <p>Leaderboard</p>
                {this.state.list.map((player, index) => {
                    console.log(list)
                    console.log(player, index)
                    return (
                        <div className='rank-profile'>
                            <span className='rank-label'>{index + 1}</span>
                            <span className='player-name'>{list[player].name}</span>
                            <span className='player-score'>{list[player].score}</span>
                        </div>
                    )
                })}
            </div>
        )
    }
}

function startCountdown() {
    var second = 1
    clearInterval(timer)
    timer = setInterval(function () {
        if (all_ready) {
            $('#countdown-timer').removeClass()
            $('#countdown-timer').addClass('second-' + second)
            if (second-- < 0) {
                $('.countdown-modal').hide()
                initGame()

                for (var id in list) {
                    var card = pile[remain--]
                    var pattern = patterns[0]
                    var set = []
                    for (var i in card) {
                        set[i] = {
                            name: card[i],
                            top: pattern[i].top,
                            left: pattern[i].left,
                            height: pattern[i].height
                        }
                    }
                    socket.emit('callback', { id: id, card: set, result: 'none' })
                }

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
                        height: pattern[i].height
                    }
                }

                reRenderComponent(<StageContainer list={list} cards={set} />)
                socket.emit('status', 'start')
                clearInterval(timer)
            }
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
                height: pattern[i].height
            }
        }

        reactComponent.setState({ cards: set })
        return true
    }
    return false
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode(document.querySelector('.admin-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.admin-container'))
}