var centre, pointer

export const pile = [
	["gnome", "magnet", "dumbbell", "pumpkin", "diamond", "badge", "oops", "hand"],
	["hand", "camera", "starfish", "plunger", "pig", "racecar", "toothbrush", "fork"],
	["pumpkin", "trumpet", "owl", "paintbrush", "highheel", "balloon", "dynamite", "racecar"],
	["bat", "butterfly", "yay", "rocket", "racecar", "acorn", "horseshoe", "badge"],
	["toothbrush", "clip", "yay", "oops", "duck", "lighthouse", "trumpet", "sandal"],
	["comb", "plunger", "scooter", "pumpkin", "potato", "hammer", "duck", "acorn"],
	["jack", "dumbbell", "trumpet", "acorn", "headphone", "pig", "scorpion", "pin"],
	["dynamite", "toothbrush", "boomerang", "badge", "planet", "snail", "scorpion", "hammer"],
	["can", "ace", "binky", "go", "pin", "racecar", "oops", "hammer"],
	["tower", "paintbrush", "scorpion", "ace", "lighthouse", "butterfly", "hand", "scooter"],
	["badge", "hourglass", "pig", "potato", "binky", "cupcake", "balloon", "lighthouse"],
	["oops", "cupcake", "plunger", "snail", "butterfly", "banana", "owl", "headphone"],
	["tomato", "hand", "acorn", "highheel", "snail", "binky", "jet", "sandal"],
	["hammer", "hand", "clip", "rocket", "balloon", "headphone", "well", "hydrant"],
	["scooter", "dynamite", "oops", "bat", "hydrant", "wheel", "pig", "jet"],
	["can", "hand", "jack", "hourglass", "duck", "dynamite", "banana", "horseshoe"],
	["racecar", "tower", "planet", "duck", "dumbbell", "tomato", "cupcake", "hydrant"],
	["camera", "scorpion", "pumpkin", "sandal", "can", "cupcake", "rocket", "wheel"],
	["tower", "highheel", "rocket", "potato", "jack", "boomerang", "oops", "starfish"],
	["camera", "diamond", "horseshoe", "snail", "trumpet", "potato", "hydrant", "ace"],
	["go", "boomerang", "bat", "trumpet", "cupcake", "hand", "comb", "lollipop"],
	["bat", "jack", "sandal", "planet", "balloon", "gnome", "ace", "plunger"],
	["well", "duck", "starfish", "binky", "owl", "bat", "diamond", "scorpion"],
	["scooter", "starfish", "snail", "can", "lollipop", "balloon", "yay", "dumbbell"],
	["planet", "trumpet", "magnet", "banana", "rocket", "scooter", "fork", "binky"],
	["go", "balloon", "toothbrush", "acorn", "wheel", "banana", "tower", "diamond"],
	["owl", "boomerang", "fork", "lighthouse", "can", "hydrant", "acorn", "gnome"],
	["tomato", "diamond", "lighthouse", "pin", "rocket", "lollipop", "dynamite", "plunger"],
	["well", "trumpet", "can", "jet", "tower", "plunger", "badge", "watermelon"],
	["magnet", "boomerang", "balloon", "jet", "duck", "butterfly", "pin", "camera"],
	["balloon", "tomato", "fork", "scorpion", "comb", "watermelon", "horseshoe", "oops"],
	["rocket", "comb", "owl", "hourglass", "toothbrush", "dumbbell", "jet", "ace"],
	["lollipop", "pig", "tower", "hammer", "sandal", "owl", "magnet", "horseshoe"],
	["sandal", "fork", "dumbbell", "butterfly", "potato", "go", "dynamite", "well"],
	["magnet", "go", "yay", "hydrant", "hourglass", "plunger", "highheel", "scorpion"],
	["well", "horseshoe", "gnome", "toothbrush", "pin", "highheel", "cupcake", "scooter"],
	["dumbbell", "banana", "hammer", "watermelon", "camera", "lighthouse", "highheel", "bat"],
	["jack", "paintbrush", "cupcake", "yay", "diamond", "hammer", "jet", "fork"],
	["wheel", "paintbrush", "plunger", "boomerang", "clip", "binky", "horseshoe", "dumbbell"],
	["banana", "clip", "jet", "gnome", "racecar", "lollipop", "potato", "scorpion"],
	["potato", "can", "magnet", "toothbrush", "paintbrush", "headphone", "tomato", "bat"],
	["sandal", "hourglass", "scooter", "diamond", "watermelon", "racecar", "boomerang", "headphone"],
	["badge", "pin", "sandal", "starfish", "banana", "comb", "hydrant", "paintbrush"],
	["boomerang", "tomato", "ace", "well", "banana", "pig", "pumpkin", "yay"],
	["lighthouse", "go", "planet", "starfish", "pumpkin", "horseshoe", "jet", "headphone"],
	["jack", "well", "snail", "racecar", "comb", "magnet", "lighthouse", "wheel"],
	["camera", "jack", "scooter", "badge", "go", "tomato", "clip", "owl"],
	["butterfly", "pig", "clip", "comb", "diamond", "planet", "can", "highheel"],
	["duck", "watermelon", "rocket", "pig", "go", "snail", "gnome", "paintbrush"],
	["magnet", "starfish", "ace", "clip", "acorn", "cupcake", "watermelon", "dynamite"],
	["wheel", "badge", "highheel", "headphone", "duck", "ace", "lollipop", "fork"],
	["highheel", "badge", "wheel", "headphone", "duck", "ace", "lollipop", "fork"],
	["pumpkin", "hydrant", "jack", "lollipop", "watermelon", "toothbrush", "binky", "butterfly"],
	["gnome", "starfish", "butterfly", "wheel", "hourglass", "trumpet", "tomato", "hammer"],
	["gnome", "yay", "camera", "comb", "tower", "headphone", "dynamite", "binky"],
	["snail", "fork", "bat", "clip", "pumpkin", "pin", "hourglass", "tower"]
]

export function initGame(player) {
	pointer = player
	shuffle()
	centre = pile[pointer + 1]
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