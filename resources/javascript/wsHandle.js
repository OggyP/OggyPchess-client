let mode = "login"

// HIDDEN
$('body > div').hide()

//Show
$('#login-wrapper').show()

let errorPageEdited = false
var wsMsg = {}
let queueMode = ""
let gameId = 0
let whitePlayer;
let blackPlayer;
let chessMode
let timerTimeout
let previousMoveTime;
let timerMoveNum = 0

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const evaluationWrapper = $("#evaluation_wrapper")

let ws = new WebSocket('wss://chess.oggyp.com:8443');

ws.onopen = function() {
    console.log("OggyP Chess Web Socket Connected on Port 8443")
    if (urlParams.has('game')) {
        sendToWs('viewGame', [
            ['gameId', urlParams.get('game')]
        ])
        $('#login-wrapper').hide()
    } else {
        checkForToken()
    }
}

ws.onclose = function() {
    displayError("Web Socket Disconnected", "Try and reload the page.")
}

ws.onerror = function() {
    displayError("Web Socket Error", "Try and reload the page.")
}

ws.onmessage = function(message) {
    try {
        const event = JSON.parse(message.data)
        console.log(event)
        const type = event.type
        const data = event.data

        if (type === 'error') {
            displayError(data.title, data.info)
        }

        if (type === 'register') {
            if (data.status === 'success') {
                showLogin()
                $('#login-info').text(data.message)
            } else {
                attemptingRegister = false
                $('#register-error').text(data.error)
            }
        } else if (type === 'login') {
            if (data.status === 'success') {
                loginSuccess(data)
                $('#in_game_login').hide()
            } else {
                $('#login-info').text(data.error)
                attemptingLogin = false
            }
        } else if (type === 'queue') {
            $('#queue_page').show()
            $('#home').hide()
            $("#queue_mode").text(modeToName[data.mode])
            $('#queue_timing').text("Time Controls: " + data.startTime / 60 / 1000 + "+" + data.increment / 1000)
            queueMode = data.mode
            mode = "queue"
        } else if (type === 'gameFound') {
            playingAgainstStockfish = false
            gameFound(data)
        } else if (type === 'timerUpdate') {
            timers = data
            timers.whiteTimer.timerStartTime = new Date().getTime()
            timers.blackTimer.timerStartTime = new Date().getTime()
            previousMoveTime = new Date().getTime()
            if (timers.whiteTimer.isCountingDown && ownTeam) $('#white_timer_text').addClass('green_background');
            else $('#white_timer_text').removeClass('green_background');
            if (timers.blackTimer.isCountingDown && !ownTeam) $('#black_timer_text').addClass('green_background');
            else $('#black_timer_text').removeClass('green_background');
        } else if (type === 'move') {
            receivedMove(event)
        } else if (type === 'gameOver') {
            clearInterval(timerTimeout);
            gameOver(data)
        } else if (type === 'oldGames') {
            drawOldGames(data)
        } else if (type === 'guestView') {
            parsePGN(data.pgn, data.gameId, data.opening)
        } else if (type === 'logout') {
            window.location.reload(true)
        }
    } catch (e) {

    }
}