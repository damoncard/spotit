var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/player', { reconnection: false })
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);
var reactComponent

import { images } from './pile.jsx'

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
                    reactComponent = ReactDOM.render(<InitContainer images={images} />, document.querySelector('.player-container'))
                } else {
                    reRenderComponent(<InitContainer images={images} />)
                }
                break
            case 'status':
                switch (value['response']) {
                    case 'online':
                        reactComponent.openStatus()
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
        this.state = {
            name: '',
            status: false,
            open_state: false,
        }
        this.changeName = this.changeName.bind(this)
        this.toggleState = this.toggleState.bind(this)
    }

    componentDidMount() {
        var react = this
        $('.form-name').submit(function (e) {
            e.preventDefault()
            var name = $('.name-input').val().trim()
            if (name.length == 0 || name.length > 10) {
                alert('Name must contain at least 1 up to 10 characters')
            } else {
                var id = $('#UserID').data('id')
                $('.name-input').attr('placeholder', name)
                $('#UserName').data('name', name)
                react.setState({ name: name })
                socket.emit('enter', { id: id, name: name })
            }
        })
    }

    changeName() {
        $('.name-input').val('')
        socket.emit('change-name')
        this.setState({ open_state: false })
        $('.name-input').focus()
    }

    toggleState() {
        var id = $('#UserID').data('id')
        var status = this.state.status
        if (status) {
            $('.state-button').css('transform', 'rotateY(0deg)')
            socket.emit('status', { id: id, status: 'not' })
            this.setState({ status: false })
        } else {
            $('.state-button').css('transform', 'rotateY(-180deg)')
            socket.emit('status', { id: id, status: 'ready' })
            this.setState({ status: true })
        }
    }

    openStatus() {
        $('.name-input').blur()
        this.setState({ open_state: true })

        $('.owl-carousel').owlCarousel({
            items: 1,
            stagePadding: 45,
            dots: true,
            margin: 20,
            center: true,
        })
    }

    render() {
        return (
            <div className='init-container'>
                <div className='input-section'>
                    <div className='introduction-container'>
                        <p className='introduction-header'>
                            Welcome to<br />
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
                {this.state.open_state &&
                    <div className='state-section'>
                        <div className='owl-carousel owl-theme' >
                            <div className='instruction-container'></div>
                            <div className='image-container'>
                                <div className='image-header'>
                                    <p className='header'>Images In the game</p>
                                </div>
                                <div className='image-showcase'>
                                    {this.props.images.map((name) => {
                                        return (
                                            <div className='image-block'>
                                                <img src={'static/pic/' + name + '.svg'} />
                                                <span className='image-indicator'>{name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className='state-container'>
                                <div className='state-header'>
                                    <span className='player-name' >{this.state.name}</span>
                                    <button className='change-name' onClick={this.changeName}>
                                        <i className='fa fa-pencil' aria-hidden='true'></i>
                                    </button>
                                </div>
                                <div className='state-detail'>
                                    <div className='game-rule-container'>
                                        <div className='game-rule'>
                                            <p className='rule-header'>Be Careful!!</p>
                                            <p className='rule-detail'>
                                                If you picking wrong <span className='rule-mark-1'>3</span> times
                                                You will get <span className='rule-mark-2'>BAN</span> for 10 seconds
                                            </p>
                                            <i className='fa fa-gamepad' aria-hidden='true'></i>
                                        </div>
                                    </div>
                                    <div className='state-button-container' onClick={this.toggleState}>
                                        <div className='state-button'>
                                            <div className='state-not'>
                                                <i className='state fa fa-times' aria-hidden='true' style={{ 'color': 'red' }}></i>
                                            </div>
                                            <div className='state-ready'>
                                                <i className='state fa fa-check' aria-hidden='true' style={{ 'color': 'green' }}></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
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
            var timer = setInterval(function () {
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