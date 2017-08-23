var React = require('react');
var ReactDOM = require('react-dom');
var io = require('socket.io-client')
var socket = io('/')
var patch = require('socketio-wildcard')(io.Manager);
patch(socket);

var count = 0
var score = 0
const page = [
    {
        'background-color': '#ffb84d',
        'margin': '0'
    },
    {
        'background-color': '#ffb84d',
        'margin': '0'
    },
    {
        'background-color': '#ffb84d',
        'margin': '0'
    },
    {
        'background-color': '#ffb84d',
        'margin': '25% auto'
    }
]

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
                changePage(1, null)
                break
            case 'status':
                switch (value['response']) {
                    case 'online':
                        changePage(2, null)
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
                            showPic(value['card'])
                            $('#score').text(++score)
                            break
                        case 'false':
                            if (++count % 3 == 0) {
                                $('#ban').show()
                                $('img').each(function () {
                                    $(this).hide()
                                })
                                setTimeout(function () {
                                    $('img').each(function () {
                                        $('#ban').hide()
                                        $(this).show()
                                    })
                                }, 10000)
                                break
                            }
                            alert('You pick the wrong one')
                            break
                        case 'end':
                            changePage(4, value['rank'])
                            count = 0
                            break
                        case 'none':
                            changePage(3, value['card'])
                            break
                    }
                }
                break
        }
    })

    $('body').on('click', 'img', function () {
        socket.emit('submit', { id: $('#UserID').attr('data-id'), value: $(this).attr('value') })
    })
    // ######################################### //
})

function setBackground(prop) {
    for (var p in prop) {
        $('body').css(prop)
    }
}

function changePage(part, element) {
    $('#container').empty()
    switch (part) {
        case 1:
            $('body').empty()
            $('body').append(`<div id='container' class='center'>
											<p class='name-label'>Please enter your name: </p>
											<input id='enter' class='enter-name' type='text' />
										   </div>`)
            $('#enter').keypress(function (e) {
                if (e.keyCode == 13) {
                    if ($('#enter').val().length == 0) {
                        alert('Name must contain at least 1 character')
                    } else {
                        var name = $('#enter').val()
                        $('#UserName').attr('data-name', name)
                        socket.emit('enter', name)
                    }
                }
            })
            setBackground(page[0])
            break
        case 2:
            setBackground(page[1])
            $('#container').attr('class', 'what')
            $('#container').append(`<div class='wrapper'>
													<a href='#' id='state' class='btn'>Click to Ready</a>
											    </div>`)
            $('#state').click(function () {
                if ($(this).text() == 'Click to Ready') {
                    $(this).text('Click to Not Ready')
                    socket.emit('status', { id: id, status: "ready" })
                } else {
                    $(this).text('Click to Ready')
                    socket.emit('status', { id: id, status: "not" })
                }
            })
            break
        case 3:
            setBackground(page[2])
            $('#container').attr('class', 'container')
            $('body').prepend(`<p class='score-label'>Your Score: </p>
										    <p id='score' class='score-label'>` + score + `<p>`)
            $('body').prepend(`<p id='ban'>You got TEMPORALLY banned, from picking the wrong one</p>`)
            $('#ban').hide()
            showPic(element)
            break
        case 4:
            setBackground(page[3])
            $('body').empty()
            $('body').append(`<p class='rank'>Your Rank:</p>`)
            $('body').append(`<p class='rank'>` + element + `</p>`)
            break
    }
}

class InitContainer extends React.Component {

    constructor(props) {
        super(props)
        this.emitSocket = this.emitSocket.bind(this)
    }

    componentDidMount() {
        $('.enter').keypress(function (e) {
            if (e.keyCode == 13) {
                if ($('#enter').val().length == 0) {
                    alert('Name must contain at least 1 character')
                } else {
                    var name = $('#enter').val()
                    $('#UserName').attr('data-name', name)
                    socket.emit('enter', name)
                }
            }
        })
    }

    render() {
        return (
            <div className='center'>
                <p className='name-label'>Please enter your name: </p>
                <input className='username' type='text' />
            </div>
        )
    }

}