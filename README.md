# Spot-it Application

This project is a webapp game that inspired from spot-it board game. Visit the links below for more info about the game:

* [Asmodee](https://www.asmodee.us/en/games/spot-it/)
* [Boardgamegeek](https://boardgamegeek.com/boardgame/63268/spot-it)
* [Fathergeek](https://fathergeek.com/spot-it/)

**Note**: This app is *not* for commercial use!

## Getting Started

These section will give you a copy of the project for development purposes. Look for 'deployment' section on how to deploy on system.

### Installing

Look forward and clone project, after that you have to install: 

* [NodeJS](https://nodejs.org/en/download/) - The js runtime for running server
* [Webpack](https://webpack.js.org/guides/installation/) - The js minifier used
* [Sass](http://sass-lang.com/install) - The css minifier used

After install those above, run this command at root folder

```
npm install
```

After finish installing, now you good to go

## Testing The App

For bundle js files go to `assets/src/js` and run command

```
webpack
```

For minimize css files go to `assets/src/sass` and run command

```
sass --style compressed main.scss:../../prod/app.min.css
```

Run this command at root folder to run server

```
node app.js
```

## Deployment

Visit this link for more info about deployment - [SeanvBaker](http://seanvbaker.com/setting-up-a-node-website/)

## Built With

* [React](https://facebook.github.io/react/) - The js framework used
* [Jquery](https://jquery.com/) - The js library used
* [Socket.io](https://socket.io/) - The js library used

## Authors

* **Sirawat Ngarmphandisorn** - [Damoncard](https://github.com/damoncard)