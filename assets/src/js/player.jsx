var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/player', { transports: ['websocket'], reconnection: false })
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);
var reactComponent

$(document).ready(function () {

    socket.on('*', function (obj) {
        var event = obj.data[0]
        var value = obj.data[1]
        console.log(event, value)
        switch (event) {
            // ################# Initialize Phase ############### //
            case 'id':
                if (value != null) {
                    $('#UserID').attr('data-id', value)
                    reactComponent = ReactDOM.render(<InitContainer />, document.querySelector('.player-container'))
                } else {
                    reRenderComponent(<InitContainer />)
                }
                break
            case 'status':
                switch (value['response']) {
                    case 'online':
                        reRenderComponent(<StateContainer />)
                        break
                    case 'offline':
                        alert('GM was offline, please wait until GM is wake up.')
                        break
                    case 'running':
                        alert('Game was already started, please wait until the game end.')
                        break
                    case 'full':
                        alert('Game was full, please wait until the seat is available')
                        break
                }
                break
            // ################## Playing Phase ################## //
            case 'callback':
                var userID = $('#UserID').attr('data-id')
                if (userID == value['id']) {
                    switch (value['result']) {
                        case 'true':
                            reactComponent.props.score++
                            reactComponent.setState({ cards: value['card'] })
                            break
                        case 'false':
                            reactComponent.faultImage()
                            break
                        case 'end':
                            reRenderComponent(<RankContainer rank={value['rank']} />)
                            break
                        case 'none':
                            reRenderComponent(<StageContainer cards={value['card']} score={0} count={0} />)
                            break
                    }
                }
                break
        }
    })
})

class InitContainer extends React.Component {

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        $('.form-name').submit(function (e) {
            e.preventDefault()
            var name = $('.name-input').val().trim()
            if (name.length == 0 || name.length > 10) {
                alert('Name must contain at least 1 up to 10 characters')
            } else {
                var id = $('#UserID').data('id')
                $('#UserName').attr('data-name', name)
                socket.emit('enter', { id: id, name: name })
            }
        })
    }

    render() {
        return (
            <div className='init-container'>
                <div className='introduction-container'>
                    <p className='introduction-header'>
                        Welcome to
                        <span style={{ 'color': '#ff9f3e' }}> S</span>
                        <span style={{ 'color': '#febac5' }}>p</span>
                        <span style={{ 'color': '#57ff6d' }}>o</span>
                        <span style={{ 'color': '#3ed1ff' }}>t</span>
                        <span>-</span>
                        <span style={{ 'color': '#fff5a5' }}>i</span>
                        <span style={{ 'color': '#3ed1ff' }}>t </span>
                        Game
                    </p>
                </div>
                <form className='form-name'>
                    <p className='name-label'>Please enter your name</p>
                    <input className='name-input' type='text' placeholder='Type your name here' />
                    <input className='submit-form' type='submit' value='OK' />
                </form>
            </div>
        )
    }
}

class StateContainer extends React.Component {

    constructor(props) {
        super(props)
        this.checkStatus = this.checkStatus.bind(this)
    }

    checkStatus() {
        var text = $('.btn-ready').text()
        var id = $('#UserID').attr('data-id')
        if (text == 'Click to Ready') {
            $('.btn-ready').text('Click to Not Ready')
            socket.emit('status', { id: id, status: 'ready' })
        } else {
            $('.btn-ready').text('Click to Ready')
            socket.emit('status', { id: id, status: 'not' })
        }
    }

    render() {
        return (
            <div className='player-status'>
                <a href='#' className='btn-ready' onClick={this.checkStatus}>Click to Ready</a>
            </div>
        )
    }
}

class StageContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            cards: props.cards,
            ban: false,
        }
        this.sendResult = this.sendResult.bind(this)
    }

    sendResult(value) {
        socket.emit('submit', { id: $('#UserID').attr('data-id'), value: value })
    }

    faultImage() {
        this.props.count++
        if (this.props.count % 3 == 0) {
            var react = this
            react.setState({ ban: true })
            var timer = setInterval(function() {
                var second = parseFloat($('.ban-second').text())
                second -= 0.1
                second = second.toFixed(1)
                $('.ban-second').text(second)
            }, 100)
            setTimeout(function () {
                clearInterval(timer)
                $('.ban-second').text(10)
                react.setState({ ban: false })
            }, 10000)
        }
    }

    render() {
        return (
            <div className='stage-container'>
                {!this.state.ban &&
                    <div className='score-indicator'>
                        <p className='score-header'>Your Score</p>
                        <p className='score-no'>{this.props.score}</p>
                    </div>
                }
                {this.state.ban ? (
                    <div className='ban-container'>
                        <p className='ban-label'>You got TEMPORALLY <span className='ban-word'>banned</span></p>
                        <p className='ban-countdown'>for <span className='ban-second'>10</span> seconds</p>
                    </div>
                ) : (
                        <div className='cards-panel'>
                            {this.state.cards.map((card) => {
                                var animation = Math.random() * 10 > 5 ? 'rotating-front ' : 'rotating-back '
                                var style = {
                                    position: 'absolute',
                                    top: card.top + '%',
                                    left: card.left + '%',
                                    height: card.height + '%',
                                    animation: animation + ((Math.random() * 10) + 1) + 's linear infinite'
                                }
                                return (
                                    <img src={'static/pic/' + card.name + '.svg'} style={style} value={card.name} onClick={() => this.sendResult(card.name)} />
                                )
                            })}
                        </div>
                    )}
                {!this.state.ban && <img src={'static/pic/trophy.svg'} className='trophy-card' onClick={() => this.sendResult('trophy')} />}
            </div>
        )
    }
}

class RankContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            rank: props.rank,
        }
    }

    render() {
        return (
            <div className='rank-container'>
                <p className='rank-header'>Your Rank: <span className='rank-no'>{this.state.rank}</span></p>
            </div>
        )
    }
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode(document.querySelector('.player-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.player-container'))
}