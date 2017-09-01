var React = require('react');
var ReactDOM = require('react-dom');
var io = require('socket.io-client')
var socket = io('/tunnel')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

import { pile, initGame } from './pile.jsx'

var reactComponent
var list = {}
var player = 0
var remain = 4 // default: 55
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
                    list[value['id']].score++
                    if (nextPic()) {
                        reactComponent.setState({ list: list })
                        socket.emit('callback', { id: value['id'], card: answer, result: 'true' })
                    } else {
                        var sorted_list = Object.keys(list).sort(function (a, b) { return list[b].score - list[a].score })

                        for (var i in sorted_list) {
                            socket.emit('callback', { id: sorted_list[i], rank: parseInt(i)+1, result: 'end' })
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
            list: props.list,
            cards: [],
        }
    }

    render() {
        return (
            <div className='stage-container'>
                <div className='player-panel'>
                    {Object.keys(this.state.list).map((player) => {
                        return (
                            <div className='player-profile'>
                                <span className='player-name'>{this.state.list[player].name}</span>
                                <span id={player} className='player-score'>{this.state.list[player].score}</span>
                            </div>
                        )
                    })}
                </div>
                <div className='cards-panel'>
                    {this.state.cards.map((card) => {
                        return (
                            <img height='100px' src={'static/pic/' + card + '.png'} value={card} />
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
            player = 0
            reRenderComponent(<InitContainer />)
        }, 15000)
    }

    render() {
        return (
            <div className='center'>
                <p>Leaderboard</p>
                {this.state.list.map(function (player, index) {
                    return (
                        <div className='rank-profile'>
                            <span className='rank-label'>{index+1}</span>
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
    var second = 5
    function countdown() {
        if (second < 0) {
            initGame()

            for (var id in list) {
                socket.emit('callback', { id: id, card: pile[remain--], result: 'none' })
            }

            reRenderComponent(<StageContainer list={list} />)
            socket.emit('status', 'start')
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

function nextPic() {
    if (remain > 0) {
        reactComponent.setState({ cards: pile[remain--] })
        return true
    }
    return false
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode(document.querySelector('.admin-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.admin-container'))
}