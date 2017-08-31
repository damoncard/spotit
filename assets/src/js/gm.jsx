var React = require('react');
var ReactDOM = require('react-dom');
var io = require('socket.io-client')
var socket = io('/tunnel')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

import {pile, getPic, initGame} from './pile.jsx'

var reactComponent
var list = {}
var player = 0
var remain = 6
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
                    reactComponent.setState({ active: true })
                    reactComponent.setState({ list: list })
                }
                break
            case 'leaving':
                if (list[value['id']] != null) {
                    delete list[value['id']]
                    reactComponent.setState({ list: list })
                }
                break
            case 'inactive':
                reactComponent.setState({ active: false })
                break
            case 'status':
                var id = value['id']
                var status = value['status'] == 'ready' ? true : false
                list[id].status = status
                player = value['player']
                $('#' + id).css('color', status ? 'green' : 'red')

                for (var i in list) {
                    if (list[i].status) {
                        all_ready = true
                        continue
                    }
                    all_ready = false
                    $('.countdown-container').hide()
                    break
                }

                if (all_ready) {
                    $('.countdown-container').show()
                    startCountdown()
                }
                break
            // ################ Playing Phase ################ //
            case 'submit':
                var result = false
                var answer = reactComponent.state.cards
                var player_choice = value['value']

                if (answer.indexOf(player_choice) != -1 || answer.indexOf('hand') != -1) {
                    result = true
                }

                if (result) {
                    if (nextPic()) {
                        list[value['id']].score++
                        reactComponent.setState({ list: list })
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
                            <p>Lobby</p><br />
                            <span>Player List</span>
                            {Object.keys(this.state.list).map((player) => {
                                return (
                                    <span id={player} className='player-name'>{this.state.list[player].name}</span>
                                )
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
                            <p class='game-label'>Spot It</p>
                        </div>
                    )}
            </div>
        )
    }
}

class StageContainer extends React.Component {

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
                        return (
                            <div className='player-profile'>
                                <span className='player-name'>{player.name}</span>
                                <span id={player} className='player-score'>{player.score}</span>
                            </div>
                        )
                    })}
                </div>
                {this.state.cards.map(function (card) {
                    <img height='100px' src={getPic(card)} value={card} />
                })}
            </div>
        )
    }
}

class RankContainer extends React.Component {

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
            socket.emit('status', 'end')
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
                    return (
                        <div className='rank-profile'>
                            <span className='rank-label'>{index}</span>
                            <span className='player-name'>{player.name}</span>
                            <span className='player-score'>{player.score}</span>
                        </div>
                    )
                })}
            </div>
        )
    }
}

function nextPic() {
    if (remain-- > 0) {
        var cards = pile[55 - remain]
        reactComponent.setState({ cards: cards })
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
            initGame(player)

            var i = 0
            for (var id in list) {
                socket.emit('acknowledge', { id: id, card: pile[i++], result: 'none' })
            }

            reRenderComponent(<StageContainer />)
            socket.emit('status', 'start')
            remain -= player
            nextPic()
            return
        }
        setTimeout(function () {
            if (all_ready) {
                $('#countdown-timer').addClass('second-' + second)
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
    ReactDOM.unmountComponentAtNode(document.querySelector('.admin-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.admin-container'))
}