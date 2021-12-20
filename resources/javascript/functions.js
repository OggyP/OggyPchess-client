function displayError (type, description) {
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

// Handle resize
function resizeCheck() {
    const chessBoardDiv = $('#chess_board')
    const piecesDiv = $('#pieces_layer')
    wrapperWidth = $('#chess_board-wrapper').width();
    wrapperHeight = $('#chess_board-wrapper').height();
    let minSize = Math.min(wrapperWidth, wrapperHeight);
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
            console.log(`translate(${(!flipBoard) ? piecePos[0] * boxSize : (7 - piecePos[0]) * boxSize}px, ${(!flipBoard) ? piecePos[1] * boxSize : (7 - piecePos[1]) * boxSize}px)`)
        })
        $('highlightedtile').remove()
        // $('piece').removeClass('piece_moved_self piece_moved_other')
        if (pieceMoved !== null) {
            // $("#piece" + pieceMoved[0] + pieceMoved[1]).addClass("piece_moved_" + moveType)
            piecesLayer.append(`<highlightedtile draggable="false" class="previous_place_${lastMoveType}" style="transform: translate(${(!flipBoard) ? (oldPos[0] * boxSize) + 'px, ' + (oldPos[1] * boxSize) : ((7 - oldPos[0]) * boxSize) + 'px, ' + ((7 - oldPos[1]) * boxSize)}px);"></highlightedtile>`)
            piecesLayer.append(`<highlightedtile draggable="false" class="piece_moved_${lastMoveType}" style="transform: translate(${(!flipBoard) ? (pieceMoved[0] * boxSize) + 'px, ' + (pieceMoved[1] * boxSize) : ((7 - pieceMoved[0]) * boxSize) + 'px, ' + ((7 - pieceMoved[1]) * boxSize)}px);"></highlightedtile>`)
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
    "standard" : "Standard Chess",
    "960"      : "Chess 960"
}
function showTimeSelection(button, gameMode) {
    queueGameMode = gameMode;
    $("#time-selection-queue-mode").text(modeToName[gameMode])
    openHomeMenu(button, '#time-selection-menu')
}

function joinQueue() {
    let startTimeAmt = document.querySelector('input[name="time_control_start"]:checked').value
    let incrementAmt = document.querySelector('input[name="time_control_inc"]:checked').value
    sendToWs('queue', [['mode', queueGameMode + ' ' + startTimeAmt + "+" + incrementAmt]])
}

function resetGame() {
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
        "Event" : "?",
        "Site"  : "chess.oggyp.com",
        "Date"  : new Date().getFullYear() + '.' + new Date().getMonth() + '.' + new Date().getDate(),
        "Round" : "?",
        "White" : "?",
        "Black" : "?",
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
        '                    <th id="white_player">White\'s Move</th>\n' +
        '                    <th id="black_player">Black\'s Move</th>\n' +
        '                </tr>')
    moveList.append('<tr>\n' +
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
            "white" : new Date(timers.whiteTimer.time),
            "black" : new Date(timers.blackTimer.time)
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

function getFENofBoard(chessboard, turn, moveNum, fiftyMoveRuleCountDown, allowCasting) {
    let FEN = ""
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
    }
    else {
        FEN += ' -'
    }
    let canEnpassant = false
    let yValToCheck = (!turn) ? 3 : 4;
    for (let x = 0; x < 8; x++) {
        if (chessboard[yValToCheck][x] !== "NA" && chessboard[yValToCheck][x].piece === 'p' && chessboard[yValToCheck][x].moves === 1 && chessboard[yValToCheck][x].lastMoveNum === moveNum - 1) {
            canEnpassant = true
            if (!turn)
                FEN += " " + toChessNotation.x[x] + toChessNotation.y[yValToCheck - 1]
            else
                FEN += " " + toChessNotation.x[x] + toChessNotation.y[yValToCheck + 1]
            break;
        }
    }
    if (!canEnpassant) FEN += ' -' // enpassant
    FEN += ` ${fiftyMoveRuleCountDown} ${1 + (Math.floor(moveNum / 2))}` // moves played
    return FEN
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
    }
    else if (data.ratings[0] > oldRating[0]) {
        whiteSymbol = "<span class='green_text'>+"
    } else {
        whiteSymbol = "<span class='red_text'>-"
    }
    let blackSymbol;
    if (Math.round(data.ratings[1] - oldRating[1]) === 0) {
        blackSymbol = "<span class='grey_text'>&plusmn;"
    }
    else if (data.ratings[1] > oldRating[1]) {
        blackSymbol = "<span class='green_text'>+"
    } else {
        blackSymbol = "<span class='red_text'>-"
    }
    $("#white_player").html(oldPlayers[0] + " | " + Math.round(data.ratings[0]) + " " + whiteSymbol + Math.abs(Math.round(data.ratings[0] - oldRating[0])) + "</span>")
    $("#black_player").html(oldPlayers[1] + " | " + Math.round(data.ratings[1]) + " " + blackSymbol + Math.abs(Math.round(data.ratings[1] - oldRating[1])) + "</span>")

    let table = $("#previous_games")
    table.prepend(formatOldGame(data.gameListInfo))
    pieceMoved = null
}

let cachedPGN = {}

function formatOldGame(oldGame) {
    cachedPGN[oldGame.id] = oldGame.pgn

    let result = "", summarisedResult = "";
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
    } catch(err) {
        alert('Error in copying url: ' + err);
    }
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=None;Secure";
}

function deleteCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=None;Secure';
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
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