function displayError(type, description) {
    if (!errorPageEdited) {
        errorPageEdited = true
        $('div').hide()
        $('#fatal-error-type').text(type)
        $('#fatal-error-description').text(description)
        $('#fatal-error').show()
    }
}

function sendToWs(eventType, data) {
    wsMsg = {}
    wsMsg.type = eventType
    if (data.constructor === Array) {
        wsMsg.data = {}
        data.forEach(item => {
            wsMsg.data[item[0]] = item[1]
        })
    } else {
        wsMsg.data = data
    }
    if (eventType !== "login")
        console.log(JSON.stringify(wsMsg))
    ws.send(JSON.stringify(wsMsg))
}

function showRegister() {
    $('#login-wrapper').hide()
    $('#register-wrapper').show()
    mode = "register"
}

function showLogin() {
    $('#register-wrapper').hide()
    $('#login-wrapper').show()
    mode = "login"
}

function showGame() {
    resetGame()
    pieceMoved = null
    $('#login-wrapper').hide()
    $('#home').hide()
    $('#game_wrapper').show()
    $("#white_timer").show()
    $("#black_timer").show()
}

let boxSize = 100;
var minSize = 100;

// Handle resize
function resizeCheck() {
    const chessBoardDiv = $('#chess_board')
    const piecesDiv = $('#pieces_layer')
    wrapperWidth = $('#chess_board-wrapper').width();
    wrapperHeight = $('#chess_board-wrapper').height();
    minSize = Math.min(wrapperWidth, wrapperHeight);
    chessBoardDiv.width(minSize)
    chessBoardDiv.height(minSize)
    piecesDiv.width(minSize)
    piecesDiv.height(minSize)
    valid_positions.width(minSize)
    valid_positions.height(minSize)
    if (boxSize !== minSize / 8) {
        boxSize = minSize / 8
        $('piece').each(function() {
            let currentElement = $(this)
            let piecePos = currentElement.attr('id').replace('piece', '')
            piecePos = [Number(piecePos[0]), Number(piecePos[1])]
            currentElement.css("transform", `translate(${(!flipBoard) ? piecePos[0] * boxSize : (7 - piecePos[0]) * boxSize}px, ${(!flipBoard) ? piecePos[1] * boxSize : (7 - piecePos[1]) * boxSize}px)`)
        })
        $('square').remove()
            // $('piece').removeClass('piece_moved_self piece_moved_other')
        if (pieceMoved !== null) {
            // $("#piece" + pieceMoved[0] + pieceMoved[1]).addClass("piece_moved_" + moveType)
            piecesLayer.append(`<square draggable="false" class="previous_place_${lastMoveType}" style="transform: translate(${(!flipBoard) ? (oldPos[0] * boxSize) + 'px, ' + (oldPos[1] * boxSize) : ((7 - oldPos[0]) * boxSize) + 'px, ' + ((7 - oldPos[1]) * boxSize)}px);"></square>`)
            piecesLayer.append(`<square draggable="false" class="piece_moved_${lastMoveType}" style="transform: translate(${(!flipBoard) ? (pieceMoved[0] * boxSize) + 'px, ' + (pieceMoved[1] * boxSize) : ((7 - pieceMoved[0]) * boxSize) + 'px, ' + ((7 - pieceMoved[1]) * boxSize)}px);"></square>`)
        }
    }
    boxSize = minSize / 8
    return minSize
        // let chessPiece = $(".chess_piece")
        // chessPiece.css("width", boxSize + "px");
        // chessPiece.css("height", boxSize + "px");
}

let queueGameMode = null;
let modeToName = {
    "standard": "Standard Chess",
    "960": "Chess 960"
}

let variantNames = {
    "960": "Chess960"
}

function showTimeSelection(button, gameMode) {
    queueGameMode = gameMode;
    $("#time-selection-queue-mode").text(modeToName[gameMode])
    openHomeMenu(button, '#time-selection-menu')
}

function showDifficultySelection(button) {
    openHomeMenu(button, '#time-selection-menu')
}

function joinQueue() {
    let startTimeAmt = document.querySelector('input[name="time_control_start"]:checked').value
    let incrementAmt = document.querySelector('input[name="time_control_inc"]:checked').value
    sendToWs('queue', [
        ['mode', queueGameMode + ' ' + startTimeAmt + "+" + incrementAmt]
    ])
}

var playingAgainstStockfish = false
var previousHashes = []

var stockfishLevel = 20

var slider = document.getElementById("stockfish-slider");
let stockfishLevelText = $("#stockfish-difficulty")
slider.oninput = function() {
    stockfishLevel = this.value
    console.log(stockfishLevel)
    stockfishLevelText.text(stockfishLevel)
}

function vsStockfish() {
    valid_positions.empty()
    let newBoard = clone(startingPos)

    for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
            if (newBoard[y][x] !== "NA")
                newBoard[y][x] = new Piece(newBoard[y][x]);

    uciCmd(`setoption name Skill Level value ${stockfishLevel}`, engine)

    previousHashes = [hashOfBoard(newBoard)]

    playingAgainstStockfish = true
    gameFound({
        "mode": "standard",
        "board": [
            newBoard,
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"
        ],
        "white": [username, ownRating],
        "black": ["Stockfish 14.1", 3500],
        "player": true
    })

    $("#timer-row").hide()

    if (!adminUserIds.includes(ownUserId)) evaluationTextExtraDisplay.hide()
}

function gameFound(data) {
    console.log(data)
    if (adminUserIds.includes(ownUserId)) {
        stopSearching(true)
        evaluationWrapper.show()
    } else {
        evaluationWrapper.hide()
    }
    valid_positions.empty()
    pieceMoved = null
    timerMoveNum = 0
    previousMoveTime = new Date().getTime()
    importedPGN = false;
    pgnMeta = ["Event", "Site", "Date", "Round", "White", "Black", "Result"]
    pgnMetaValues = {
        "Event": "?",
        "Site": "chess.oggyp.com",
        "Date": new Date().getFullYear() + '.' + new Date().getMonth() + '.' + new Date().getDate(),
        "Round": "?",
        "White": "?",
        "Black": "?",
        "Result": "*"
    }
    chessMode = data.mode

    chessBoard = data.board[0]
    if (chessMode !== 'standard') {
        pgnMetaValues['FEN'] = data.board[1]
        pgnMeta.push('FEN')
        pgnMetaValues['Variant'] = variantNames[chessMode]
        pgnMeta.push('Variant')
    }
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
    whitePlayerName.html(whitePlayer[0] + " <span class='in-game-rating'>" + Math.round(whitePlayer[1]) + "</span>")
    blackPlayerName.html(blackPlayer[0] + " <span class='in-game-rating'>" + Math.round(blackPlayer[1]) + "</span>")
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
}

function resetGame() {
    stopSearching(true)
    importedPGN = false
    selectedPiece = null;
    moveNum = 0
    fiftyMoveRuleCountDown = 50
    turn = true;
    forcedEnpassant = true;
    drawCurrentBoard = true;
    boardAtMove = []
    showingBoard = 0;
    pgnMetaValues = {
        "Event": "?",
        "Site": "chess.oggyp.com",
        "Date": new Date().getFullYear() + '.' + new Date().getMonth() + '.' + new Date().getDate(),
        "Round": "?",
        "White": "?",
        "Black": "?",
        "Result": "*"
    }
    pgnMeta = ["Event", "Site", "Date", "Round", "White", "Black", "Result"]
    pgnText = ""
    pgnDownload = ""
    chessBoard = clone(startingPos)

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (chessBoard[y][x] !== "NA") {
                chessBoard[y][x] = new Piece(chessBoard[y][x]);
            }
        }
    }
    $('#share_game').hide()
    $('#home').show()
    $('#in_game_options').show()
    moveList.empty()
    moveList.append('<tr>\n' +
        '                    <th class="move-num"></th>\n' +
        '                    <th id="white_player">White\'s Username</th>\n' +
        '                    <th id="black_player">Black\'s Username</th>\n' +
        '                </tr>')
    moveList.append('<tr id="timer-row">\n' +
        '                    <th class="move-num"></th>\n' +
        '                    <th id="white_timer"><span id="white_timer_text" class="timer_text"></span></th>\n' +
        '                    <th id="black_timer"><span id="black_timer_text" class="timer_text"></span></th>\n' +
        '                </tr>')
    $("#white_player").css('font-size', 'xx-large')
    $("#black_player").css('font-size', 'xx-large')
    $("#white_timer").hide()
    $("#black_timer").hide()
    $("#game_wrapper").hide()
    $('#reset_game').hide()
    openingDisplay.text('Starting Position')
    mode = "home"
}

let timers = null

function updateTimer() {
    if (timers !== null) {
        let timeRemaining = {
            "white": new Date(timers.whiteTimer.time),
            "black": new Date(timers.blackTimer.time)
        }
        if (timers.whiteTimer.isCountingDown) timeRemaining.white = new Date(timers.whiteTimer.time - ((new Date().getTime()) - timers.whiteTimer.timerStartTime))
        if (timers.blackTimer.isCountingDown) timeRemaining.black = new Date(timers.blackTimer.time - ((new Date().getTime()) - timers.blackTimer.timerStartTime))
        let displayText = [timeRemaining.white.toUTCString().split(' ')[4], timeRemaining.black.toUTCString().split(' ')[4]]
        if (displayText[0].startsWith('00:')) displayText[0] = displayText[0].replace('00:', '')
        if (displayText[1].startsWith('00:')) displayText[1] = displayText[1].replace('00:', '')
        $("#white_timer_text").text(displayText[0])
        $("#black_timer_text").text(displayText[1])
    }
}

// format date function (Kaelan)
function formatDate(timestamp) {
    let event = new Date(timestamp);
    let today = new Date();
    let yesterday = new Date(Date.now() - 864e5);

    let options = {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
    };

    let date = event.toLocaleDateString(undefined, options).split(', ');
    let currentDate = today.toLocaleDateString(undefined, options).split(', ');
    let yesterDate = yesterday.toLocaleDateString(undefined, options).split(', '); // get it? yesterDATE

    let day;
    if (date[1] == currentDate[1]) {
        day = "Today";
    } else if (date[1] == yesterDate[1]) {
        day = "Yesterday";
    } else {
        day = "on " + date[0] + ", " + date[1];
    }

    return date[2] + " " + day;
}

function getFENofBoard(chessboard, turn, moveNumber, fiftyMoveRuleCountDown, allowCasting) {
    let FEN = ""
    console.log(moveNumber)
    for (let i = 0; i < 8; i++) {
        let emptySpaceCount = 0;
        for (let j = 0; j < 8; j++) {
            if (chessboard[i][j] !== 'NA') {
                let pieceFENcode = (chessboard[i][j].team) ? chessboard[i][j].piece.toUpperCase() : chessboard[i][j].piece;
                if (emptySpaceCount > 0) {
                    FEN += emptySpaceCount.toString()
                }
                FEN += pieceFENcode
                emptySpaceCount = 0
            } else {
                emptySpaceCount++
            }
        }
        if (emptySpaceCount > 0) {
            FEN += emptySpaceCount.toString()
        }
        FEN += "/"
    }
    FEN = FEN.slice(0, -1) // Remove excess '/'
    FEN += ' ' + ((!turn) ? 'w' : 'b') // current move
    if (allowCasting) {
        FEN += ' '
        castlingToAdd = ''
        castlingToAdd += (chessboard[7][4] !== "NA" && chessboard[7][4].moves === 0 && chessboard[7][4].piece === 'k' && chessboard[7][7] !== "NA" && chessboard[7][7].moves === 0) ? 'K' : '';
        castlingToAdd += (chessboard[7][4] !== "NA" && chessboard[7][4].moves === 0 && chessboard[7][4].piece === 'k' && chessboard[7][0] !== "NA" && chessboard[7][0].moves === 0) ? 'Q' : '';
        castlingToAdd += (chessboard[0][4] !== "NA" && chessboard[0][4].moves === 0 && chessboard[0][4].piece === 'k' && chessboard[0][7] !== "NA" && chessboard[0][7].moves === 0) ? 'k' : '';
        castlingToAdd += (chessboard[0][4] !== "NA" && chessboard[0][4].moves === 0 && chessboard[0][4].piece === 'k' && chessboard[0][0] !== "NA" && chessboard[0][0].moves === 0) ? 'q' : '';
        if (castlingToAdd.length === 0) castlingToAdd = '-'
        FEN += castlingToAdd
    } else {
        FEN += ' -'
    }
    let canEnpassant = false
    let yValToCheck = (!turn) ? 3 : 4;
    for (let x = 0; x < 8; x++) {
        if (chessboard[yValToCheck][x] !== "NA" && chessboard[yValToCheck][x].piece === 'p' && chessboard[yValToCheck][x].moves === 1) {
            console.log(chessboard[yValToCheck][x].lastMoveNum + " | " + moveNumber)
            if (chessboard[yValToCheck][x].lastMoveNum === moveNumber - 1) {
                canEnpassant = true
                if (!turn)
                    FEN += " " + toChessNotation.x[x] + toChessNotation.y[yValToCheck - 1]
                else
                    FEN += " " + toChessNotation.x[x] + toChessNotation.y[yValToCheck + 1]
                break;
            }
        }
    }
    if (!canEnpassant) FEN += ' -' // enpassant
    FEN += ` ${fiftyMoveRuleCountDown} ${1 + (Math.floor(moveNumber / 2))}` // moves played
    return FEN
}

function resign() {
    if (!playingAgainstStockfish) {
        sendToWs('game', [
            ['option', 'resign']
        ])
    } else {
        gameOverAgainstStockfish("0-1", "Resignation")
    }
}

function gameOverAgainstStockfish(type, reason) {
    playingAgainstStockfish = false
    stopSearchingEngine()
    $('#reset_game').show()
    $("#in_game_options").hide()
    importedPGN = true
    mode = "gameOver"
    alertOfGameOver(type, reason)
    drawBoard()
    evaluationWrapper.show()
}

function FENtoGame(FEN) {
    let startingBoard = []
    let FENparts = FEN.split(' ')
    let rows = FENparts[0].split('/')
    for (let rowNum = 0; rowNum < 8; rowNum++) {
        startingBoard.push([])
        let row = rows[rowNum]
        for (let i = 0; i < row.length; i++) {
            if (!isNaN(row[i])) {
                for (let j = 0; j < Number(row[i]); j++) {
                    startingBoard[rowNum].push('NA')
                }
            } else {
                if (row[i].toUpperCase() === row[i]) { // row[i] is upper case
                    // Piece is white
                    startingBoard[rowNum].push(row[i].toLowerCase() + "l")
                } else {
                    // Piece is black
                    startingBoard[rowNum].push(row[i] + "d")
                }
            }
        }
    }
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (startingBoard[y][x] !== "NA") {
                startingBoard[y][x] = new Piece(startingBoard[y][x]);
            }
        }
    }
    return startingBoard
}

const playStopAnimationButton = $("#stop_stop_animation")
var playMovesInterval = null

function updatePlayAnimation() {
    if (!drawCurrentBoard) {
        showingBoard++
        if (showingBoard >= moveNum) {
            showingBoard = moveNum
            drawCurrentBoard = true;
            oldPos = boardAtMove[moveNum].startPos
            pieceMoved = boardAtMove[moveNum].endingPos
            if (ownTeam === null)
                drawBoard(chessBoard, showingBoard, boardAtMove[moveNum].board[boardAtMove[moveNum].endingPos[1]][boardAtMove[moveNum].endingPos[0]].team)
            else
                drawBoard()
            $('#resume_game').hide()
            stopPlayAnimation()
        } else {
            goToMove(showingBoard)
        }
    } else {
        stopPlayAnimation()
    }
}

function startPlayAnimation() {
    if (showingBoard === moveNum)
        showingBoard = 0
    drawCurrentBoard = false
    updatePlayAnimation()
    playMovesInterval = setInterval(updatePlayAnimation, 1000)
    playStopAnimationButton.text("Stop")
    playStopAnimationButton.attr("onclick", "stopPlayAnimation()")
}

function stopPlayAnimation() {
    clearInterval(playMovesInterval)
    playStopAnimationButton.text("Play")
    playStopAnimationButton.attr("onclick", "startPlayAnimation()")
}

var animationInterval = null
var animations = [] // {elem, frames (out of 20), startingPos, endingPos}

function updateAnimations() {
    // console.log("ran update animations")
    for (let i = 0; i < animations.length; i++) {
        let currentAnimation = animations[i]
        currentAnimation.frame++
            if (currentAnimation.frame <= 20) {
                let wayThroughAnimation = currentAnimation.frame / 20
                currentAnimation.elem.css("transform", `translate(${lerp(currentAnimation.startingPos[0], currentAnimation.endingPos[0], wayThroughAnimation)}px, ${lerp(currentAnimation.startingPos[1], currentAnimation.endingPos[1], wayThroughAnimation)}px)`)
            } else {
                animations.splice(i, 1)
            }
    }
    if (animations.length === 0 && animationInterval !== null) {
        clearInterval(animationInterval)
    }
}

function finishAnimations() {
    for (let i = 0; i < animations.length; i++) {
        let currentAnimation = animations[i]
        currentAnimation.elem.css("transform", `translate(${currentAnimation.endingPos[0]}px, ${currentAnimation.endingPos[1]}px)`)
    }
    animations = []
}

function gameOver(data) {
    mouseUp()
    importedPGN = true
    mode = "gameOver"
    $('#reset_game').show()
    gameId = data.gameId
    $('#share_game').show()
    $("#in_game_options").hide()
    alertOfGameOver(data.type, data.info)
    $('#top-bar-username').text(username + " | " + Math.round(data.newRating))
    let whiteSymbol;
    if (Math.round(data.ratings[0] - oldRating[0]) === 0) {
        whiteSymbol = "<span class='grey_text'>&plusmn;"
    } else if (data.ratings[0] > oldRating[0]) {
        whiteSymbol = "<span class='green_text'>+"
    } else {
        whiteSymbol = "<span class='red_text'>-"
    }
    let blackSymbol;
    if (Math.round(data.ratings[1] - oldRating[1]) === 0) {
        blackSymbol = "<span class='grey_text'>&plusmn;"
    } else if (data.ratings[1] > oldRating[1]) {
        blackSymbol = "<span class='green_text'>+"
    } else {
        blackSymbol = "<span class='red_text'>-"
    }
    if (ownTeam)
        $('#account-username').html(username + "<span id=\"account-rating\">" + Math.round(data.ratings[0]) + "</span>")
    else
        $('#account-username').html(username + "<span id=\"account-rating\">" + Math.round(data.ratings[1]) + "</span>")
    $("#white_player").html(oldPlayers[0] + " <span class='in-game-rating'>" + Math.round(data.ratings[0]) + "</span> " + whiteSymbol + Math.abs(Math.round(data.ratings[0] - oldRating[0])) + "</span>")
    $("#black_player").html(oldPlayers[1] + " <span class='in-game-rating'>" + Math.round(data.ratings[1]) + "</span> " + blackSymbol + Math.abs(Math.round(data.ratings[1] - oldRating[1])) + "</span>")
    if (ownTeam)
        ownRating = data.ratings[0]
    else
        ownRating = data.ratings[1];

    let table = $("#previous_games")
    table.prepend(formatOldGame(data.gameListInfo))
    if (adminUserIds.includes(ownUserId)) stopSearching(true)
    drawBoard()
    evaluationWrapper.show()
}

let cachedPGN = {}

function formatOldGame(oldGame) {
    cachedPGN[oldGame.id] = oldGame.pgn

    let result = "",
        summarisedResult = "";
    if (oldGame.score === "1-0") {
        summarisedResult += (oldGame.white === username) ? "Won" : "Lost";
    } else if (oldGame.score === "0-1") {
        summarisedResult += (oldGame.black === username) ? "Won" : "Lost";
    } else {
        summarisedResult += "Draw";
    }
    if (oldGame.reason.includes("game abandoned")) {
        result = summarisedResult + " by abandonment";
    } else {
        result = summarisedResult + " by " + oldGame.reason;
    }

    if (oldGame.white.length >= 14) oldGame.white = oldGame.white.slice(0, 10) + "..."
    if (oldGame.black.length >= 14) oldGame.black = oldGame.black.slice(0, 10) + "..."

    return `<tr><td class="old-games-vertical-spacer" colspan="5"></td></tr>
            <tr
              onclick="parsePGN(cachedPGN[${oldGame.id}], ${oldGame.id}, '${oldGame.opening.replaceAll("'", "\\'")}'); $('#reset_game').show()"
              onmouseover="$(this).next().css('background', 'var(--dark)'); $(this).css('background', 'var(--dark)');"
              onmouseleave="$(this).next().css('background', 'none'); $(this).css('background', 'none');"
            >
                <td class="og-summary-result ${summarisedResult}">${summarisedResult}</td>
                <td class="old-games-white">${oldGame.white}</td>
                <td class="old-games-vs">vs</td>
                <td class="old-games-black">${oldGame.black}</td>
                <td class="old-games-mode">${oldGame.gameMode}</td>
            </tr>`
}

function drawOldGames(data) {
    let table = $("#previous_games")
    let oldGames = JSON.parse(data.gameList)
    console.log(oldGames)
    oldGames.forEach(oldGame => {
        table.append(formatOldGame(oldGame))
    })
}

async function copyURLToClipboard() {
    try {
        await navigator.clipboard.writeText('https://chess.oggyp.com/?game=' + gameId);
        alert('URL copied to clipboard!');
    } catch (err) {
        alert('Error in copying url: ' + err);
    }
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=None;Secure";
}

function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=None;Secure';
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function lerp(a, b, n) {
    return (1 - n) * a + n * b;
}

function openHomeMenu(button, menu) {
    $('.home_item').removeClass('disabled');
    $(button).addClass('disabled');
    $('.home_menu').hide();
    $('.home_menu').css('opacity', 0);
    $(menu).css('display', 'flex');
    $(menu).animate({ opacity: 1 }, 250);
}

function closeHomeMenu(menu) {
    $(menu).animate({ opacity: 0 }, 250, () => {
        $(menu).hide();
    });
    $('.home_item').removeClass('disabled');
}

function hashOfBoard(board) {
    let boardPieceCode = []
    for (let y = 0; y < 8; y++) {
        boardPieceCode.push([])
        for (let x = 0; x < 8; x++) {
            if (board[y][x] !== "NA") {
                boardPieceCode[y].push(board[y][x].code)
            } else {
                boardPieceCode[y].push('NA')
            }
        }
    }
    return JSON.stringify(boardPieceCode).hashCode()
}

function hashFoundThreeTimes(hashList, hash) {
    let hashCount = 0
    for (let i = 0; i < hashList.length; i++) {
        if (hashList[i] === hash) {
            hashCount++
            console.log("Repeat")
        }
    }
    if (hashCount > 1) {
        // two or more due to a new one being added to make it three
        return true
    } else {
        hashList.push(hash)
        return hashList
    }
}

String.prototype.hashCode = function() {
    var hash = 0,
        i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
}