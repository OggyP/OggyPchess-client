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
            if (adminUserIds.includes(ownUserId)) {
                stopSearching()
                evaluationWrapper.show()
            } else {
                evaluationWrapper.hide()
            }
            pieceMoved = null
            timerMoveNum = 0
            previousMoveTime = new Date().getTime()
            importedPGN = false;
            let pgnMetaValues = {
                "Event": "?",
                "Site": "chess.oggyp.com",
                "Date": new Date().getFullYear() + '.' + new Date().getMonth() + '.' + new Date().getDate(),
                "Round": "?",
                "White": "?",
                "Black": "?",
                "Result": "*",
                "Mode": "normal",
                "StartingPos": ""
            }
            chessMode = data.mode
            pgnMetaValues['Mode'] = chessMode
            chessBoard = data.board[0]
            pgnMetaValues['StartingPos'] = data.board[1]
            boardAtMove = [{ "board": clone(chessBoard) }]
            whitePlayer = data.white
            blackPlayer = data.black
            oldRating[0] = whitePlayer[1]
            oldRating[1] = blackPlayer[1]
            oldPlayers[0] = whitePlayer[0]
            oldPlayers[1] = blackPlayer[0]
            $('#queue_page').hide()
            $('#home').hide()
            $("#game_wrapper").show()
            const whitePlayerName = $("#white_player")
            const blackPlayerName = $("#black_player")
            whitePlayerName.text(whitePlayer[0] + " | " + Math.round(whitePlayer[1]))
            blackPlayerName.text(blackPlayer[0] + " | " + Math.round(blackPlayer[1]))
            whitePlayerName.css('font-size', 'large')
            blackPlayerName.css('font-size', 'large')
            $("#white_timer").show()
            $("#black_timer").show()
            ownTeam = data.player
            pgnMetaValues['White'] = whitePlayer[0]
            pgnMetaValues['Black'] = blackPlayer[0]
            flipBoard = !data.player
            mode = "game"
            resizeCheck()
            drawBoard()
            timerTimeout = setInterval(function() {
                updateTimer()
            }, 1000);
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
            reveivedMove(event)
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