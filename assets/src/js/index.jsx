var React = require('react');
var ReactDOM = require('react-dom');
var socket = io.connect('/')

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
    // ################# Initialize Phase ############### //
    socket.on('id', function (key) {
        if (key != null) {
            $('#UserID').attr('data-id', key)
        }
        changePage(1, null)
    })
    socket.on('status', function (token) {
        switch (token['response']) {
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
        }
    })
    // ################ Playing Phase ################ //							
    socket.on('callback', function (token) {
        var userID = $('#UserID').attr('data-id')
        if (userID == token['key']) {
            switch (token['result']) {
                case 'true':
                    showPic(token['card'])
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
                    changePage(4, token['rank'])
                    count = 0
                    break
                case 'none':
                    changePage(3, token['card'])
                    break
            }
        }
    })

    $('body').on('click', 'img', function () {
        socket.emit('choose', { key: $('#UserID').attr('data-id'), value: $(this).attr('value') })
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
                        socket.emit('enter', { key: name })
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
                    socket.emit('ready', { key: id })
                } else {
                    $(this).text('Click to Ready')
                    socket.emit('notready', { key: id })
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