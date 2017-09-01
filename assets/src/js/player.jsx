var React = require('react');
var ReactDOM = require('react-dom');
var io = require('socket.io-client')
var socket = io('/')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);
var reactComponent

$(document).ready(function () {

    socket.on('*', function (obj) {
        var event = obj.data[0]
        var value = obj.data[1]
        switch (event) {
            // ################# Initialize Phase ############### //
            case 'id':
                if (value != null) {
                    $('#UserID').attr('data-id', value)
                }
                reactComponent = ReactDOM.render(<InitContainer />, document.querySelector('.player-container'))
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
                            reactComponent.setState({ score: reactComponent.state.score + 1 })
                            reactComponent.setState({ cards: value['card'] })
                            reactComponent.setState({ pattern: value['pattern'] })
                            break
                        case 'false':
                            reactComponent.faultImage()
                            break
                        case 'end':
                            reRenderComponent(<RankContainer rank={value['rank']} />)
                            break
                        case 'none':
                            console.log('test')
                            reRenderComponent(<StageContainer cards={value['card']} />)
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
        this.enterName = this.enterName.bind(this)
    }

    enterName(key) {
        if (key.key == 'Enter') {
            var name = $('.input-name').val().trim()
            if (name.length == 0) {
                alert('Name must contain at least 1 character')
            } else {
                $('#UserName').attr('data-name', name)
                socket.emit('enter', name)
            }
        }
    }

    render() {
        return (
            <div className='center'>
                <p className='name-label'>Please enter your name: </p>
                <input className='input-name' type='text' onKeyPress={this.enterName} />
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
            score: 0,
            count: 0,
            cards: props.cards,
            pattern: props.pattern,
        }
    }

    componentDidMount() {
        $('.stage-container').on('click', 'img', function () {
            socket.emit('submit', { id: $('#UserID').attr('data-id'), value: $(this).val() })
        })
    }

    faultImage() {
        var count = this.state.count
        this.setState({ count: count + 1 })
        if (count % 3 == 0) {
            $('.ban-label').show()
            $('.stage-container' > 'img').each(function () {
                $(this).hide()
            })
            setTimeout(function () {
                $('.ban-label').hide()
                $('.stage-container' > 'img').each(function () {
                    $(this).show()
                })
            }, 10000)
        }
        alert('You pick the wrong one')
    }

    render() {
        return (
            <div className='stage-container'>
                <p className='score-label'>Your Score: <span className='score-label'>{this.state.score}</span></p>
                <p className='ban-label' style={{ 'display': 'none' }}>You got TEMPORALLY banned, from picking the wrong one</p>
                {this.state.cards.map((card) => {
                    return (
                        <img height='100px' src={'static/pic/' + card + '.png'} value={card} />
                    )
                })}
            </div>
        )
    }
}

class RankContainer extends React.Component {

    constructor(props) {
        super(props)
        this.state.rank = props.rank
    }

    render() {
        return (
            <div className='container-margin'>
                <p className='rank'>Your Rank: <span className='rank'>{this.state.rank}</span></p>
            </div>
        )
    }
}

function reRenderComponent(component) {
    ReactDOM.unmountComponentAtNode(document.querySelector('.player-container'))
    reactComponent = ReactDOM.render(component, document.querySelector('.player-container'))
}