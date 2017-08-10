var centre, pointer, pile

function init(player) {
	pointer = player
	shuffle()
	centre = pile[pointer+1]
}

function showPic(set) {
	$('div').empty()
	for (var card in set) {
		$('div').append(`<img height='100' src='` + getPic(set[card]) + `' value='` + set[card] + `' />`)
	}
}

function getPic(name) {
	return symbol[name]
}

function shuffle() {
	var j, x, i = 55
	while (i) {
		j = parseInt(Math.random() * i);
		x = pile[--i]
		pile[i] = pile[j]
		pile[j] = x
	}
}