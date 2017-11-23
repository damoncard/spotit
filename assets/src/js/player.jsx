var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/player')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);
var reactComponent
var player_name = ''

import { images } from './pile.jsx'

$(document).ready(function () {

    socket.on('*', function (obj) {
        var event = obj.data[0]
        var value = obj.data[1]
        switch (event) {
            // ################# Initialize Phase ############### //
            case 'setup':
                if (value['id'] != null) {
                    $('#UserID').attr('data-id', value['id'])
                    reactComponent = ReactDOM.render(<InitContainer images={images} />, document.querySelector('.player-container'))
                } else {
                    reRenderComponent(<InitContainer images={images} name={player_name} />)
                    if (value['refresh']) {
                        reactComponent.openStatus()
                    }
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
            case 'loading':
                reRenderComponent(<LoadingContainer />)
                break
            case 'result':
                var userID = $('#UserID').attr('data-id')
                if (userID == value['id']) {
                    switch (value['result']) {
                        case 'true':
                            reactComponent.reactToAnswer(true)
                            reactComponent.props.score++
                            reactComponent.props.count = 0
                            reactComponent.setState({ cards: value['card'] })
                            break
                        case 'false':
                            reactComponent.reactToAnswer(false)
                            reactComponent.faultImage()
                            break
                        case 'end':
                            reRenderComponent(<RankContainer rank={value['rank']} color={value['color']} />)
                            break
                        case 'none':
                            reRenderComponent(<StageContainer cards={value['card']} score={0} count={0} />)
                            break
                    }
                }
                break
        }
    })

    $(window).on('orientationchange', function (event) {
        if (window.orientation != 90 && window.orientation != -90) {
            $('.block-container').show()
        } else {
            $('.block-container').hide()
        }
    })

    if (window.orientation != 90 && window.orientation != -90 && window.orientation != undefined) {
        $('.block-container').show()
    }


    socket.emit('ready')
})

class InitContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            name: props.name,
            status: false,
            open_state: false,
        }
        this.changeName = this.changeName.bind(this)
        this.toggleState = this.toggleState.bind(this)
    }

    componentDidMount() {
        var react = this

        $('.name-input').keypress(function(event){
            var ew = event.charCode;
            if(ew == 13 || 
               48 <= ew && ew <= 57 ||
               65 <= ew && ew <= 90 ||
               97 <= ew && ew <= 122) {
                return true;
            } else {
                alert('Only english character and numbers are allow')
                return false;
            }
        });

        $('.form-name').submit(function (e) {
            e.preventDefault()
            var name = $('.name-input').val().trim()
            if (name.length == 0 || name.length > 8) {
                alert('Name must contain at least 1 up to 8 characters')
            } else {
                var id = $('#UserID').data('id')
                $('.name-input').attr('placeholder', name)
                $('#UserName').attr('data-name', name)
                player_name = name
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
            $('.change-name').show()
            socket.emit('status', { id: id, status: 'not' })
            this.setState({ status: false })
        } else {
            $('.state-button').css('transform', 'rotateY(-180deg)')
            $('.change-name').hide()
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

        $('.owl-carousel').on('changed.owl.carousel', function (event) {
            var currentPage = event.item.index
            if (currentPage == 2) {
                $('.name-box').addClass('inverted')
                $('.ready-box').addClass('inverted')
            } else {
                $('.name-box').removeClass('inverted')
                $('.ready-box').removeClass('inverted')
            }
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
                            <div className='instruction-container container'>
                                <div className='header'>
                                    <p>About Game</p>
                                </div>
                                <div className='instruction-detail detail'>
                                    <div className='instruction-about'>
                                        <p>This game was inspired by Spot-IT</p>
                                    </div>
                                    <div className='instruction-goal'>
                                        <p>
                                            <span>Objective: </span>To collect as many cards as possible
                                        </p>
                                    </div>
                                    {/* <div className='instruction-illustration'>
                                        <img src='static/pic/megaphone.svg' className='megaphone' />
                                    </div> */}
                                    <div className='instruction-rule'>
                                        <p>
                                            <span>Rule: </span>
                                            Players have to try to spot the one symbol that appears both on the
                                            center card and on their own cards. If you are the first player to do so
                                            call it out
                                        </p>
                                    </div>
                                    <div className='instruction-card'>
                                        <img src='static/pic/sword.svg' style={{ 'position': 'absolute', 'top': '11%', 'left': '16%', 'width': '20%' }} />
                                        <img src='static/pic/guitar.svg' style={{ 'position': 'absolute', 'top': '7%', 'left': '43%', 'width': '20%' }} />
                                        <img src='static/pic/milk.svg' style={{ 'position': 'absolute', 'top': '41%', 'left': '5%', 'width': '30%' }} />
                                        <img src='static/pic/computer.svg' style={{ 'position': 'absolute', 'top': '20%', 'left': '61%', 'width': '30%' }} />
                                        <img src='static/pic/ace.svg' style={{ 'position': 'absolute', 'top': '72%', 'left': '28%', 'width': '25%' }} />
                                        <img src='static/pic/tree.svg' style={{ 'position': 'absolute', 'top': '65%', 'left': '65%', 'width': '20%' }} />
                                        <img src='static/pic/mouse.svg' style={{ 'position': 'absolute', 'top': '53%', 'left': '46%', 'width': '20%' }} />
                                        <img src='static/pic/trophy.svg' style={{ 'position': 'absolute', 'top': '32%', 'left': '30%', 'width': '20%' }} />
                                    </div>
                                </div>
                            </div>
                            <div className='how-container container'>
                                <div className='header'>
                                    <p>How To Play</p>
                                </div>
                                <img src='static/pic/arrow.svg' className='arrow-pic' />
                                <div className='how-detail detail'>
                                    <div className='how-card'>
                                        <img src='static/pic/clip.svg' style={{ 'position': 'absolute', 'top': '16%', 'left': '16%', 'width': '20%' }} />
                                        <img src='static/pic/balloon.svg' style={{ 'position': 'absolute', 'top': '7%', 'left': '41%', 'width': '20%' }} />
                                        <img src='static/pic/tree.svg' style={{ 'position': 'absolute', 'top': '41%', 'left': '7%', 'width': '30%' }} />
                                        <img src='static/pic/doll.svg' style={{ 'position': 'absolute', 'top': '16%', 'left': '65%', 'width': '20%' }} />
                                        <img src='static/pic/fox.svg' style={{ 'position': 'absolute', 'top': '72%', 'left': '30%', 'width': '20%' }} />
                                        <img src='static/pic/rocket.svg' style={{ 'position': 'absolute', 'top': '68%', 'left': '61%', 'width': '20%' }} />
                                        <img src='static/pic/trumpet.svg' style={{ 'position': 'absolute', 'top': '39%', 'left': '75%', 'width': '20%' }} />
                                        <img src='static/pic/lollipop.svg' style={{ 'position': 'absolute', 'top': '36%', 'left': '40%', 'width': '30%' }} />
                                    </div>
                                    <div className='how-special'>
                                        <p>
                                            Special Case:
                                        <img src='static/pic/trophy.svg' />
                                            Trophy worth <span>5</span> points
                                    </p>
                                    </div>
                                    <div className='how-rule'>
                                        <p className='rule-header'>Be Careful!! </p>
                                        <p className='rule-detail'>
                                            If you picked wrong <span>3</span> times on the card<br />
                                            You will get <span>BANNED</span> for 5 seconds
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='image-container container'>
                                <div className='header'>
                                    <p>Images</p>
                                </div>
                                <div className='image-showcase detail'>
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
                        </div>
                        <div className='name-box'>
                            <p>
                                {this.state.name}
                                <button className='change-name' onClick={this.changeName}>
                                    <i className='fa fa-pencil' aria-hidden='true'></i>
                                </button>
                            </p>
                        </div>
                        <div className='ready-box'>
                            <div className='state-button-container'>
                                <div className='state-button' onClick={this.toggleState}>
                                    <div className='state-not'>
                                        <p>Ready</p>
                                    </div>
                                    <div className='state-ready'>
                                        <p>Not Ready</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
            </div>
        )
    }
}

class LoadingContainer extends React.Component {
    
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className='loading-container'>
                <p className='loading-text'>Loading...</p>
                <i className='fa fa-spinner fa-spin' aria-hidden='true'></i>
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

    reactToAnswer(result) {
        if (result) {
            $('.score-no').addClass('pass')
            setTimeout(function () {
                $('.score-no').removeClass('pass')
            }, 200)
        } else {
            $('.score-no').addClass('fail')
            setTimeout(function () {
                $('.score-no').removeClass('fail')
            }, 200)
        }
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
                $('.ban-second').text(5)
                react.setState({ ban: false })
            }, 5000)
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
                        <p className='ban-label'>You got TEMPORALLY <br /><span className='ban-word'>banned</span></p>
                        <p className='ban-countdown'>for <span className='ban-second'>5</span> seconds</p>
                    </div>
                ) : (
                        <div className='cards-panel'>
                            {this.state.cards.map((card) => {
                                {/* var animation = Math.random() * 10 > 5 ? 'rotating-front ' : 'rotating-back' */ }
                                {/* animation: animation + ((Math.random() * 10) + 1) + 's linear infinite' */ }
                                
                                var rotate = Math.random() * 10 > 5 ? '1' : '-1'
                                var degree = Math.random() * 360
                                var style = {
                                    
                                    position: 'absolute',
                                    top: card.top + '%',
                                    left: card.left + '%',
                                    width: card.width + '%',
                                    transform: 'scaleX(' + rotate + ') rotate(' + degree + 'deg)'
                                }
                                return (

                                    <img className='react' src={'static/pic/' + card.name + '.svg'} style={style} value={card.name} onClick={() => this.sendResult(card.name)} />

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

    componentDidMount() {
        $('.rank-container').css('background-color', this.props.color)
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