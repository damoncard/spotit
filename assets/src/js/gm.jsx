var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/admin', { reconnection: false })
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

import { pile, patterns, initGame } from './pile.jsx'

var reactComponent
var timer
var list = {}
var remain
var all_ready = false
var iconid


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
                        // checkStatus()
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

                    socket.emit('status', 'online')
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
                

                // if(status){
                //     alert("first");
                //     $('#'+id).addClass('whatthefuck');
                //     // $('#' + id).removeClass('fa-times')
                    

                // }

                // if (status) {
                //     .removeClass('fa-times')
                //    .addClass('fa-check')
                // } else { 
                //     .addClass('fa-times')
                //     .removeClass('fa-check')
                // }



                // $('img')
                // $('.fa-times')
                // $('#')
                // $('img[name=test]')











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
                        if (trophy != 0) {
                            var id = $('ul > li:nth-child(' + trophy + ') > .player-no').data('id')
                            list[id].score += 5
                            list[id].trophy = true
                        }
                        var sorted_list = Object.keys(list).sort(function (a, b) { return list[b].score - list[a].score })

                        for (var i in sorted_list) {
                            socket.emit('result', { id: sorted_list[i], rank: parseInt(i) + 1, result: 'end' })
                        }

                        reRenderComponent(<RankContainer list={sorted_list} />)
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
        var launcher = setInterval(function() {
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
                                <p>Lobby</p>
                                <p className='list-header'>Player List</p>
                            </div>
                            <div className='list-box'>
                                <table>
                                        <thead>
                                        <tr>
                                          <th scope="col">Player Name</th>
                                          <th scope="col">Status</th>
                                          
                                        </tr>
                                      </thead>
                                      
                                      <tbody>
                                        {Object.keys(this.state.list).map((player) => {
                                            return (
                                                    <tr>
                                                      <td scope="row"> 
                                                            <p id={player} className='player-name' style={{ 'color': 'red' }}>{this.state.list[player].name}</p>
                                                      </td>
                                                      <td>
                                                        {/*  <i class="fa fa-times" aria-hidden="true"></i> */}
                                                        {/*   <img id={player} className="setimg" src="static/pic/check-mark.svg"></img> */}
                                                         <i id='2' className='fa fa-times' style={{ 'color': 'red' , 'font-size':'2rem' }}></i>
                                                        {/* <i id={player} className='fa fa-check' style={{ 'color': 'green' , 'font-size':'2rem' }}></i> */}
                                                      </td>
                                                      
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
                <ul className='bubbles'>
                </ul>
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
    }

    trophyTaken(id) {
        var pos = parseInt($('#trophy-pos').data('pos'))
        var player = parseInt($('#' + id).parent().children('.player-no').text())
        var pixel = (player - pos) * 56
        if (pos == 0) {
            pixel += 14 // -70 for first player pos +56 for later player
        }
        if (pixel != 0) {
            $('.trophy-token').css('transform', 'translateY(' + pixel + 'px)')
        }
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
                            return (
                                index % 2 == 0 ? (
                                    <li style={{ 'background-color': '#fdb4bf' }}>
                                        <span className='player-no' data-id={player}>{index + 1}</span>
                                        <span className='player-name'>{this.state.list[player].name}</span>
                                        <span id={player} className='player-score'>{this.state.list[player].score}</span>
                                    </li>
                                ) : (
                                        <li style={{ 'background-color': '#ffdddd' }}>
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
                        var animation = Math.random() * 10 > 5 ? 'rotating-front ' : 'rotating-back '
                        var style = {
                            position: 'absolute',
                            top: card.top + '%',
                            left: card.left + '%',
                            width: card.width + '%',
                            animation: animation + ((Math.random() * 10) + 1) + 's linear infinite'
                        }
                        return (
                            <img src={'static/pic/' + card.name + '.svg'} style={style} value={card.name} />
                        )
                    })}
                </div>
                <input type='hidden' id='trophy-pos' data-pos='0' />>
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

            for (var id in list) {
                if (list.hasOwnProperty(id)) {
                    list[id].score = 0
                    list[id].status = false
                    list[id].trophy = false
                }
            }

            reRenderComponent(<InitContainer />)
            reactComponent.setState({ active: true })
            reactComponent.setState({ list: list })
        }, 10000)
    }

    render() {
        return (

            <div className='rank-container'>
                <p className='rank-header'>Leaderboard</p>
                <div className='player-list'>
                    {this.state.list.map((player, index) => {
                        return (

                            <div className='rank-profile'>
                                {list[player].trophy && <img src='static/pic/trophy.svg' className='trophy-token' />}
                                <span className='rank-label'>{index + 1}</span>
                                <span className='player-name'>{list[player].name}</span>
                                <span className='player-score'>{list[player].score}</span>
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
                remain = 2
                //Math.ceil(Object.keys(list).length * 6.8)
                initGame()

                for (var id in list) {
                    var selected = Math.floor(Math.random() * 7)
                    var card = pile[remain--]
                    var pattern = patterns[selected]
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
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode(document.querySelector('.admin-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.admin-container'))
}