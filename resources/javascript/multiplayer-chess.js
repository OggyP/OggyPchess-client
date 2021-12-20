let flipBoard = false;
const valid_positions = $("#valid_positions");
const piecesLayer = $("#pieces_layer");
const moveList = $("#move_list")
const PGNView = $("#PGN_view")
const openingDisplay = $("#opening")
const FENdisplay = $("#fen_display")
let selectedPiece = null;
let moveNum = 0
let fiftyMoveRuleCountDown = 50

let turn = true;
let forcedEnpassant = true;
let drawCurrentBoard = true;
let boardAtMove = []
let showingBoard = 0;

let pieceMoved = null
let oldPos = null
let importedPGN = false

let gavinAudio = new Audio('/resources/audio/gavinCheck.mp3')

const startingPos = [
    ["rd", "nd", "bd", "qd", "kd", "bd", "nd", "rd"],
    ["pd", "pd", "pd", "pd", "pd", "pd", "pd", "pd"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["pl", "pl", "pl", "pl", "pl", "pl", "pl", "pl"],
    ["rl", "nl", "bl", "ql", "kl", "bl", "nl", "rl"],
]

const emptyBoard = [
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
    ["NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"],
]

let reDrawBoard = emptyBoard;

let pgnMetaValues = {
    "Event" : "?",
    "Site"  : "chess.oggyp.com",
    "Date"  : new Date().getFullYear() + '.' + new Date().getMonth() + '.' + new Date().getDate(),
    "Round" : "?",
    "White" : "?",
    "Black" : "?",
    "Result": "*",
    "Mode"  : "normal",
    "FEN" : ""
}
let pgnMeta = ["Event", "Site", "Date", "Round", "White", "Black", "Result", "Mode", "FEN"]
let pgnText = ""
let pgnDownload = ""

const pieceCodesD = ['qd', 'rd', 'bd', 'nd']
const pieceCodesL = ['ql', 'rl', 'bl', 'nl']

class Piece {
    constructor(pieceId) {
        this.code = pieceId;
        // true = white | false = black
        this.team = (pieceId[1] === 'l');
        this.piece = pieceId[0];
        this.moves = 0;
        this.clicked = false;
        this.lastMoveNum = -10;
    }
}

const toChessNotation = {
    x: {
        0: 'a',
        1: 'b',
        2: 'c',
        3: 'd',
        4: 'e',
        5: 'f',
        6: 'g',
        7: 'h'
    },
    y: {
        0: '8',
        1: '7',
        2: '6',
        3: '5',
        4: '4',
        5: '3',
        6: '2',
        7: '1'
    }
}

const fromChessNotation = {
    x: {
        'a' : 0,
        'b' : 1,
        'c' : 2,
        'd' : 3,
        'e' : 4,
        'f' : 5,
        'g' : 6,
        'h' : 7
    },
    y: {
        '8': 0,
        '7': 1,
        '6': 2,
        '5': 3,
        '4': 4,
        '3': 5,
        '2': 6,
        '1': 7
    }
}

let chessBoard = clone(startingPos)

for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
        if (chessBoard[y][x] !== "NA") {
            chessBoard[y][x] = new Piece(chessBoard[y][x]);
        }
    }
}

function reveivedMove(event) {
    timers = event.data.timer
    timers.whiteTimer.timerStartTime = new Date().getTime()
    timers.blackTimer.timerStartTime = new Date().getTime()
    previousMoveTime = new Date().getTime()
    if (timers.whiteTimer.isCountingDown && ownTeam) $('#white_timer_text').addClass('green_background'); else $('#white_timer_text').removeClass('green_background');
    if (timers.blackTimer.isCountingDown && !ownTeam) $('#black_timer_text').addClass('green_background'); else $('#black_timer_text').removeClass('green_background');
    if (chessBoard[event.data.startingPos[1]][event.data.startingPos[0]] !== 'NA') {
        $("piece").css("opacity", "1")
        pieceMoved = event.data.endingPos
        oldPos = event.data.startingPos
        if (turn) fiftyMoveRuleCountDown--
        chessBoard[event.data.startingPos[1]][event.data.startingPos[0]].moves++;
        chessBoard[event.data.startingPos[1]][event.data.startingPos[0]].lastMoveNum = moveNum;
        if (event.data.hasOwnProperty('promote')) {
            appendMoveToList(event.data.startingPos, event.data.endingPos, false, event.data.timer, event.data.promote)
            chessBoard[event.data.endingPos[1]][event.data.endingPos[0]] = new Piece(event.data.promote)
            chessBoard[event.data.endingPos[1]][event.data.endingPos[0]].moves = chessBoard[event.data.startingPos[1]][event.data.startingPos[0]].moves + 1
            chessBoard[event.data.endingPos[1]][event.data.endingPos[0]].lastMoveNum = moveNum
            chessBoard[event.data.startingPos[1]][event.data.startingPos[0]] = "NA"
        } else {
            if (event.data.hasOwnProperty('specialCase')) {
                if (event.data.specialCase === "enpassant") {
                    // delete enpassant pawn
                    appendMoveToList(event.data.startingPos, [event.data.endingPos[0], event.data.endingPos[1]], true, event.data.timer)
                    chessBoard[event.data.startingPos[1]][event.data.endingPos[0]] = 'NA'
                    chessBoard[event.data.endingPos[1]][event.data.endingPos[0]] = clone(chessBoard[event.data.startingPos[1]][event.data.startingPos[0]])
                    chessBoard[event.data.startingPos[1]][event.data.startingPos[0]] = "NA"
                } else if (event.data.specialCase === "castle") {
                    appendMoveToList(event.data.startingPos, [event.data.endingPos[0], event.data.endingPos[1]], false, event.data.timer)
                    if (event.data.endingPos[0] > event.data.startingPos[0]) {
                        // castle right
                        chessBoard[event.data.endingPos[1]][7].moves++;
                        chessBoard[event.data.endingPos[1]][7].lastMoveNum = moveNum;
                        chessBoard[event.data.endingPos[1]][5] = clone(chessBoard[event.data.endingPos[1]][7])
                        chessBoard[event.data.endingPos[1]][6] = clone(chessBoard[event.data.endingPos[1]][4])
                        chessBoard[event.data.endingPos[1]][4] = 'NA'
                        chessBoard[event.data.endingPos[1]][7] = 'NA'
                    } else {
                        // castle left
                        chessBoard[event.data.endingPos[1]][0].moves++;
                        chessBoard[event.data.endingPos[1]][0].lastMoveNum = moveNum;
                        chessBoard[event.data.endingPos[1]][3] = clone(chessBoard[event.data.endingPos[1]][0])
                        chessBoard[event.data.endingPos[1]][2] = clone(chessBoard[event.data.endingPos[1]][4])
                        chessBoard[event.data.endingPos[1]][4] = 'NA'
                        chessBoard[event.data.endingPos[1]][0] = 'NA'
                    }
                }
            } else {
                appendMoveToList(event.data.startingPos, [event.data.endingPos[0], event.data.endingPos[1]], false, event.data.timer)
                chessBoard[event.data.endingPos[1]][event.data.endingPos[0]] = clone(chessBoard[event.data.startingPos[1]][event.data.startingPos[0]])
                chessBoard[event.data.startingPos[1]][event.data.startingPos[0]] = "NA"
            }
        }
        valid_positions.empty();
        drawBoard()
        // if other team in checkmate
        if (!checkIfGameOver() && inCheck(chessBoard, !turn)) {
            appendToMove("+")
        }
        if (ownTeam === !turn && inCheck(chessBoard, !turn)) {
            gavinAudio.play()
        }
        turn = !turn
        boardAtMove.push({'board': clone(chessBoard), 'startPos': event.data.startingPos, 'endingPos': event.data.endingPos})
        moveNum++;
    }
    if (moveNum < 30) {
        if (chessMode === 'standard') {
            if (openingList.hasOwnProperty(pgnText.slice(0, -1))) {
                openingDisplay.text(openingList[pgnText.slice(0, -1)].ECO + " | " + openingList[pgnText.slice(0, -1)].Name)
            }
        } else {
            openingDisplay.text("Custom Position")
        }
    }
    if (JSON.stringify(chessBoard) === badChessBoard) {
        alert("Ok Gavin")
    }
    if (forcedEnpassant && turn === ownTeam) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (chessBoard[y][x] !== "NA" && chessBoard[y][x].team === ownTeam  && chessBoard[y][x].piece === 'p') {
                    let locations = movesOfPiece(x, y, chessBoard[y][x])
                    for (let i = 0; i < locations.length; i++) {
                        if (locations[i].length === 3 && locations[i][2]) {
                            let newBoard = clone(chessBoard)
                            newBoard[locations[i][1]][locations[i][0]] = clone(chessBoard[y][x])
                            newBoard[y][x] = "NA"
                            newBoard[y][locations[i][0]] = "NA"
                            if (!inCheck(newBoard, ownTeam)) {
                                sendToWs('move', [['startingPos', [x, y]], ['endingPos', [locations[i][0], locations[i][1]]]])
                            }
                        }
                    }
                }
            }
        }
    }
}

function parsePGN(pgn, pgnGameId = 0, opening = '') {
    chessMode = 'standard'
    ownTeam = null
    try {
        resetGame()
        pgnDownload = pgn
        if (pgnGameId !== 0) {
            gameId = pgnGameId
            $('#share_game').show()
        } else {
            $('#reset_game').show()
        }
        if (opening !== '') {
            openingDisplay.text(opening)
        }
        let PGNMeta = {}
        PGNMeta['Mode'] = "standard"
        let lines = pgn.split('\n')
        let pgnValues = ""
        for (let i = 0; i < lines.length; i++) {
            if (lines[i][0] !== '[' && lines[i] !== '') {
                pgnValues +=  lines[i] + " "
            }
        }
        pgnValues = pgnValues.slice(0, -1);
        lines.pop()
        lines.forEach(line => {
            if (line[0] === '[') {
                PGNMeta[line.split(' ')[0].slice(1)] = line.split('"')[1]
            }
        })
        
        pgnValues = pgnValues.split(" ")
        if (PGNMeta.hasOwnProperty('FEN')) {
            // Custom starting positions
            chessBoard = FENtoGame(PGNMeta["FEN"])
        }
        if (PGNMeta.hasOwnProperty('Mode')) {
            chessMode = PGNMeta["Mode"]
        }

        $('#loading').hide()
        $('#queue_page').hide()
        $('#home').hide()
        $("#game_wrapper").show()
        if (PGNMeta.hasOwnProperty('White')) $("#white_player").text((PGNMeta['White'].length > 18) ? PGNMeta['White'].slice(0, 15) + "..." : PGNMeta['White'])
        if (PGNMeta.hasOwnProperty('Black')) $("#black_player").text((PGNMeta['Black'].length > 18) ? PGNMeta['Black'].slice(0, 15) + "..." : PGNMeta['Black'])
        $('#in_game_options').hide()
        boardAtMove.push({'board': clone(chessBoard)})
        drawCurrentBoard = false
        importedPGN = true
        let pgnMoves = ""
        pgnValues.forEach(move => {
            pgnMoves += move + " "
            if (move === '1-0' || move === '0-1' || move === '1/2-1/2') { // - means it is the end of the pgn and is the score,
                moveList.append("<tr><td class='move-num'>Game Over</td><td>" + move + "</td></tr>")
            } else if (!move.includes('.')) { // the . means it is a move number indicator
                let originalMove = move
                let promoteChoice = false
                let isCheckMate = move.includes('#')
                move = move.replace('x', '').replace('+', '').replace('#', '')
                move = move.split('=')
                if (move.length === 2) promoteChoice = move[1]
                move = move[0]
                let startingPos
                let endingPos
                if (move === 'O-O') {
                    let castleYval = (turn) ? 7 : 0
                    // castle king side (right)
                    if (legalMovesOfPiece([4, castleYval], [6, castleYval])[0] === 'castle') {
                        startingPos = [4, castleYval]
                        endingPos = [6, castleYval]
                        chessBoard[castleYval][7].moves++;
                        chessBoard[castleYval][7].lastMoveNum = moveNum;
                        chessBoard[castleYval][4].moves++;
                        chessBoard[castleYval][4].lastMoveNum = moveNum;
                        chessBoard[castleYval][5] = clone(chessBoard[castleYval][7])
                        chessBoard[castleYval][6] = clone(chessBoard[castleYval][4])
                        chessBoard[castleYval][4] = 'NA'
                        chessBoard[castleYval][7] = 'NA'
                    } else {
                        displayError('Invalid PGN Castle King Side', 'Error at internal move number ' + moveNum + ', ' + originalMove)
                    }
                } else if (move === 'O-O-O') {
                    // queen side castle
                    let castleYval = (turn) ? 7 : 0
                    if (legalMovesOfPiece([4, castleYval], [2, castleYval])[0] === 'castle') {
                        startingPos = [4, castleYval]
                        endingPos = [2, castleYval]
                        chessBoard[castleYval][0].moves++;                              // rook
                        chessBoard[castleYval][0].lastMoveNum = moveNum;                // rook
                        chessBoard[castleYval][4].moves++;                              // king
                        chessBoard[castleYval][4].lastMoveNum = moveNum;                // king
                        chessBoard[castleYval][3] = clone(chessBoard[castleYval][0])    // move rook
                        chessBoard[castleYval][2] = clone(chessBoard[castleYval][4])    // move king
                        chessBoard[castleYval][4] = 'NA'                                // delete king from old pos
                        chessBoard[castleYval][0] = 'NA'                                // delete rook from old pos
                    } else {
                        displayError('Invalid PGN Castle Queen Side', 'Error at internal move number ' + moveNum + ', ' + originalMove)
                    }
                } else if (move.length === 2) {
                    // pawn move / pawn promote | no special case
                    const xVal = fromChessNotation.x[move[0]]
                    const yVal = fromChessNotation.y[move[1]]
                    endingPos = [xVal, yVal]
                    let update = false
                    for (let startYval = 0; startYval < 8; startYval++) {
                        if (chessBoard[startYval][xVal].piece === 'p' && chessBoard[startYval][xVal].team === turn) {
                            let response = legalMovesOfPiece([xVal, startYval], [xVal, yVal])
                            if (response[0] === true) {
                                startingPos = [xVal, startYval]
                                chessBoard = response[1]
                                update = true
                                if (promoteChoice !== false) {
                                    if (turn) {
                                        if (yVal === 0 && pieceCodesL.includes(promoteChoice.toLowerCase() + 'l')) {
                                            chessBoard[yVal][xVal] = new Piece(promoteChoice.toLowerCase() + 'l')
                                        }
                                    } else {
                                        if (yVal === 7 && pieceCodesD.includes(promoteChoice.toLowerCase() + 'd')) {
                                            chessBoard[yVal][xVal] = new Piece(promoteChoice.toLowerCase() + 'd')
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (!update) {
                        displayError('Invalid PGN Pawn Move', 'Error at internal move number ' + moveNum + ', ' + originalMove)
                    }
                } else if (move[0] === move[0].toUpperCase()) {
                    // not pawn
                    let extraVals = move.length - 3
                    endingPos = [fromChessNotation.x[move[1 + extraVals]], fromChessNotation.y[move[2 + extraVals]]]
                    let update = false
                    boardLoop:
                        for (let y = 0; y < 8; y++) {
                            for (let x = 0; x < 8; x++) {
                                if (chessBoard[y][x] !== 'NA' && chessBoard[y][x].piece === move[0].toLowerCase() && chessBoard[y][x].team === turn) {
                                    let allowed = true
                                    if (extraVals > 0) {
                                        if (isNaN(parseInt(move[1]))) {
                                            // value is x axis e.g. e
                                            if (fromChessNotation.x[move[1]] !== x) allowed = false
                                        } else {
                                            // value is y axis e.g. 3
                                            if (fromChessNotation.y[move[1]] !== y) allowed = false
                                        }
                                    }
                                    if (allowed) {
                                        let response = legalMovesOfPiece([x, y], endingPos)
                                        if (response[0]) {
                                            startingPos = [x, y]
                                            chessBoard = response[1]
                                            update = true
                                            break boardLoop
                                        }
                                    }
                                }
                            }
                        }
                    if (!update) {
                        displayError('Invalid PGN Non Pawn / Non Special Move', 'Error at internal move number ' + moveNum + ', ' + originalMove)
                    }
                } else {
                    // is pawn and is taking
                    let takeOffset = (turn) ? 1 : -1 // white takes from a y level one larger than what it is taking, black is opposite at 1 y level lower
                    endingPos = [fromChessNotation.x[move[1]], fromChessNotation.y[move[2]]]
                    let startingX = fromChessNotation.x[move[0]]
                    let response = legalMovesOfPiece([startingX, endingPos[1] + takeOffset], endingPos)
                    if (response[0] === 'enpassant' || response[0] === true) {
                        startingPos = [startingX, endingPos[1] + takeOffset]
                        chessBoard = response[1]
                        if (promoteChoice !== false) {
                            if (turn) {
                                if (endingPos[1] === 0 && pieceCodesL.includes(promoteChoice.toLowerCase() + 'l')) {
                                    chessBoard[endingPos[1]][endingPos[0]] = new Piece(promoteChoice.toLowerCase() + 'l')
                                }
                            } else {
                                if (endingPos[1] === 7 && pieceCodesL.includes(promoteChoice.toLowerCase() + 'd')) {
                                    chessBoard[endingPos[1]][endingPos[0]] = new Piece(promoteChoice.toLowerCase() + 'd')
                                }
                            }
                        }
                    } else {
                        displayError('Invalid PGN Pawn Take', 'Error at internal move number ' + moveNum + ', ' + originalMove)
                    }
                }
                if (turn) {
                    // white so new line
                    moveList.append("<tr>\n" +
                        "   <td class='move-num'>" + (moveNum / 2 + 1) + "</td>\n" +
                        "   <td onclick='goToMove(" + (moveNum + 1) + ")' id='move" + moveNum + "'>" + originalMove + "</td>\n" +
                        "   <td id='move" + (moveNum + 1) + "'></td>\n" +
                        "</tr>")
                } else {
                    //black turn so edit td - id moveNum
                    let element = $("#move" + moveNum)
                    element.text(originalMove)
                    element.attr("onclick", "goToMove(" + (moveNum + 1) + ")")
                }
                if (chessMode === 'standard') {
                    if (opening === '' && moveNum < 30 && typeof openingList !== 'undefined')
                        if (openingList.hasOwnProperty(pgnMoves.slice(0, -1)))
                            openingDisplay.text(openingList[pgnMoves.slice(0, -1)].ECO + " | " + openingList[pgnMoves.slice(0, -1)].Name)
                } else {
                    openingDisplay.text("Custom Position")
                }
                turn = !turn
                moveNum++
                oldPos = startingPos
                pieceMoved = endingPos
                boardAtMove.push({'board': clone(chessBoard), 'startPos': startingPos, 'endingPos': endingPos})
            }
        })
        showingBoard = moveNum
        drawBoard(chessBoard, moveNum, !turn)
    }
    catch (e) {
        console.log(e)
        displayError('PGN Invalid', 'JS Error: ' + e.toString())
    }
}

function legalMovesOfPiece(startingPos, endingPos) {
    let clickedPiece = chessBoard[startingPos[1]][startingPos[0]]
    if (clickedPiece !== 'NA' && clickedPiece.team === turn) {
        // then they can move that pieceId
        let locations = movesOfPiece(startingPos[0], startingPos[1], clickedPiece)
        for (let i = 0; i < locations.length; i++) {
            let newBoard = clone(chessBoard)
            newBoard[startingPos[1]][startingPos[0]].moves++;
            newBoard[startingPos[1]][startingPos[0]].lastMoveNum = moveNum
            newBoard[locations[i][1]][locations[i][0]] = clone(newBoard[startingPos[1]][startingPos[0]])
            newBoard[startingPos[1]][startingPos[0]] = "NA"
            if (locations[i].length === 3) {
                if (locations[i][2]) {
                    //check if the king is in check
                    newBoard[startingPos[1]][locations[i][0]] = "NA"
                    // ENPASSANT
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        return ['enpassant', newBoard, true]
                        // third value is if 50 move rule should be reset
                    }
                } else {
                    // castle (already check for in check)
                    return ['castle']
                }
            } else {
                //check if the king is in check
                if (!inCheck(newBoard, clickedPiece.team)) {
                    if (locations[i][0] === endingPos[0] && locations[i][1] === endingPos[1]) {
                        // move is legal
                        if (clickedPiece.piece === 'p' || chessBoard[endingPos[1]][endingPos[0]] !== 'NA') {
                            return [true, newBoard, true]
                        }
                        return [true, newBoard]
                    }
                }
            }
        }
    }
    return [false];
}

function pieceClicked(xVal, yVal) {
    if (drawCurrentBoard && !importedPGN) {
        $("piece").css("opacity", "1")
        $("#piece" + xVal + yVal).css("opacity", "0.6")
        valid_positions.empty()
        selectedPiece = [xVal, yVal]
        let clickedPiece = chessBoard[yVal][xVal]
        if (turn === clickedPiece.team && ownTeam === clickedPiece.team) {
            let locations = movesOfPiece(xVal, yVal, clickedPiece)
            locations.forEach(location => {
                let newBoard = clone(chessBoard)
                newBoard[location[1]][location[0]] = clone(clickedPiece)
                newBoard[yVal][xVal] = "NA"
                let drawY = (!flipBoard) ? location[1] : 7 - location[1]
                let drawX = (!flipBoard) ? location[0] : 7 - location[0]
                let onClickText = null
                if (location.length === 3) {
                    if (location[2]) {
                        //check if the king is in check
                        newBoard[yVal][location[0]] = "NA"
                        // ENPASSANT
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            onClickText = 'pieceMove(' + location[0] + ', ' + location[1] + ', true)'
                        }
                    } else {
                        // castle
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            onClickText = 'pieceMove(' + location[0] + ', ' + location[1] + ', true, \'castle\')'
                        }
                    }
                } else {
                    //check if the king is in check
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        onClickText = 'pieceMove(' + location[0] + ', ' + location[1] + ')'
                    }
                }
                if (onClickText !== null)
                    valid_positions.append(`<validpos onclick="${onClickText}" draggable="false" style="transform: translate(${drawX * boxSize}px, ${drawY * boxSize}px);"></validpos>`)
                //`<highlightedtile draggable="false" class="piece_moved_${moveType}" style="transform: translate(${(!flipBoard) ? (pieceMoved[0] * boxSize) + 'px, ' + (pieceMoved[1] * boxSize) : ((7 - pieceMoved[0]) * boxSize) + 'px, ' + ((7 - pieceMoved[1]) * boxSize)}px);"></highlightedtile>`
            })
        }
    }
}

function alertOfGameOver(score, reason) {
    if (reason === 'By checkmate') {
        // checkmate
        appendToMove("#", moveNum - 1)
    }
    moveList.append("<tr><td>Game Over</td><td>" + score + "</td></tr>")
    alert(score + " | " + reason)
    pgnMetaValues["Result"] = score
    pgnText += score
    writePGN()
}

function pieceMove(xVal, yVal, specialCase = false, type = "enpassant") {
    if (chessBoard[selectedPiece[1]][selectedPiece[0]].code === 'pl' && yVal === 0) {
        // show promotion selector light
        $("piecePromote").remove()
        let pieceCodes = ['ql', 'rl', 'bl', 'nl']
        for (let idx = 0; idx < pieceCodes.length; idx++) 
            piecesLayer.append('<piecePromote onclick="promote(' + xVal + ', ' + yVal + ', \'' + pieceCodes[idx] + '\')" draggable="false" class="' + pieceCodes[idx][0] + ' ' + pieceCodes[idx][1] + `" alt="K-L" style="transform: translate(${(!flipBoard) ? ((idx * 3 / 4) * boxSize) + 'px, ' + (yVal * boxSize) : ((idx * 3 / 4) * boxSize) + 'px, ' + ((7 - yVal) * boxSize)}px);"></piecePromote>`)
    }
    else if (yVal === 7 && chessBoard[selectedPiece[1]][selectedPiece[0]].code === 'pd') {
        // show promotion selector light
        $("piecePromote").remove()
        let pieceCodes = ['qd', 'rd', 'bd', 'nd']
        for (let idx = 0; idx < pieceCodes.length; idx++)
            piecesLayer.append('<piecePromote onclick="promote(' + xVal + ', ' + yVal + ', \'' + pieceCodes[idx] + '\')" draggable="false" class="' + pieceCodes[idx][0] + ' ' + pieceCodes[idx][1] + `" alt="K-L" style="transform: translate(${(!flipBoard) ? ((idx * 3 / 4) * boxSize) + 'px, ' + (yVal * boxSize) : ((idx * 3 / 4) * boxSize) + 'px, ' + ((7 - yVal) * boxSize)}px);"></piecePromote>`)
    } else {
        if (selectedPiece !== null && chessBoard[selectedPiece[1]][selectedPiece[0]] !== 'NA') {
            sendToWs('move', [['startingPos', selectedPiece], ['endingPos', [xVal, yVal]]])
            valid_positions.empty();
        }
        if (moveNum < 30) {
            if (chessMode === 'standard') {
                if (openingList.hasOwnProperty(pgnText.slice(0, -1))) {
                    openingDisplay.text(openingList[pgnText.slice(0, -1)].ECO + " | " + openingList[pgnText.slice(0, -1)].Name)
                }
            } else {
                openingDisplay.text("Custom Position")
            }
        }
    }
}

function promote(xVal, yVal, choice) {
    sendToWs('move', [['startingPos', selectedPiece], ['endingPos', [xVal, yVal]], ['promote', choice]])
    $("piecePromote").remove()
    valid_positions.empty();
}

function movesOfPiece(xVal, yVal, clickedPiece) {
    let locations = []
    if (clickedPiece.code === 'pl') {
        if (yVal - 1 >= 0) {
            if (chessBoard[yVal - 1][xVal] === "NA") {
                locations.push([xVal, yVal - 1])
                // First move
                if (yVal - 2 > 0 && clickedPiece.moves === 0 && chessBoard[yVal - 2][xVal] === "NA") {
                    locations.push([xVal, yVal - 2])
                }
            }
            // take on diagonals
            if (xVal - 1 >= 0 && chessBoard[yVal - 1][xVal - 1] !== "NA" && !chessBoard[yVal - 1][xVal - 1].team) {
                locations.push([xVal - 1, yVal - 1])
            }
            if (xVal + 1 <= 7 && chessBoard[yVal - 1][xVal + 1] !== "NA" && !chessBoard[yVal - 1][xVal + 1].team) {
                locations.push([xVal + 1, yVal - 1])
            }
        }
        // enpassant right
        if (xVal + 1 <= 7 && yVal === 3 && chessBoard[yVal][xVal + 1].code === 'pd' && chessBoard[yVal][xVal + 1].moves === 1 && chessBoard[yVal][xVal + 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal + 1, yVal - 1, true])
        }
        // enpassant left
        if (xVal - 1 >= 0 && yVal === 3 && chessBoard[yVal][xVal - 1].code === 'pd' && chessBoard[yVal][xVal - 1].moves === 1 && chessBoard[yVal][xVal - 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal - 1, yVal - 1, true])
        }
    }
    if (clickedPiece.code === 'pd') {
        // normal move
        if (yVal + 1 <= 7) {
            if (chessBoard[yVal + 1][xVal] === "NA") {
                locations.push([xVal, yVal + 1])
                // First move
                if (yVal + 2 < 8 && clickedPiece.moves === 0 && chessBoard[yVal + 2][xVal] === "NA") {
                    locations.push([xVal, yVal + 2])
                }
            }
            // take on diagonals
            if (xVal - 1 >= 0 && chessBoard[yVal + 1][xVal - 1] !== "NA" && chessBoard[yVal + 1][xVal - 1].team) {
                locations.push([xVal - 1, yVal + 1])
            }
            if (xVal + 1 <= 7 && chessBoard[yVal + 1][xVal + 1] !== "NA" && chessBoard[yVal + 1][xVal + 1].team) {
                locations.push([xVal + 1, yVal + 1])
            }
        }
        // enpassant right
        if (xVal + 1 <= 7 && yVal === 4 && chessBoard[yVal][xVal + 1].code === 'pl' && chessBoard[yVal][xVal + 1].moves === 1 && chessBoard[yVal][xVal + 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal + 1, yVal + 1, true])
        }
        // enpassant left
        if (xVal - 1 >= 0 && yVal === 4 && chessBoard[yVal][xVal - 1].code === 'pl' && chessBoard[yVal][xVal - 1].moves === 1 && chessBoard[yVal][xVal - 1].lastMoveNum === moveNum - 1) {
            locations.push([xVal - 1, yVal + 1, true])
        }
    }
    if (clickedPiece.piece === 'n') {
        let vectors = [[2, 1], [1, 2], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
        locations = getVectorsAbsolute(xVal, yVal, vectors, clickedPiece.team)
    }
    if (clickedPiece.piece === 'b') {
        let vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1]]
        locations = rayCastVectors(xVal, yVal, vectors, clickedPiece)
    }
    if (clickedPiece.piece === 'q') {
        let vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]]
        locations = rayCastVectors(xVal, yVal, vectors, clickedPiece)
    }
    if (clickedPiece.piece === 'r') {
        let vectors = [[0, 1], [1, 0], [0, -1], [-1, 0]]
        locations = rayCastVectors(xVal, yVal, vectors, clickedPiece)
    }
    if (clickedPiece.piece === 'k') {
        let vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]]
        locations = getVectorsAbsolute(xVal, yVal, vectors, clickedPiece.team)

        if (chessMode === 'standard' && clickedPiece.moves === 0 && !inCheck(chessBoard, clickedPiece.team)) {
            // castling
            // right
            if (chessBoard[yVal][xVal + 3] !== 'NA' && chessBoard[yVal][xVal + 3].moves === 0) {
                if (chessBoard[yVal][xVal + 2] === 'NA' && chessBoard[yVal][xVal + 1] === 'NA') {
                    // can castle not including through check
                    // check if castling through check
                    let newBoard = clone(chessBoard)
                    newBoard[yVal][xVal + 1] = clone(clickedPiece)
                    newBoard[yVal][xVal] = "NA"
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        newBoard[yVal][xVal + 2] = clone(clickedPiece)
                        newBoard[yVal][xVal + 1] = "NA"
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            locations.push([xVal + 2, yVal, false])
                        }
                    }
                }
            }
            //left
            if (chessBoard[yVal][xVal - 4] !== 'NA' && chessBoard[yVal][xVal - 4].moves === 0) {
                if (chessBoard[yVal][xVal - 3] === 'NA' && chessBoard[yVal][xVal - 2] === 'NA' && chessBoard[yVal][xVal - 1] === 'NA') {
                    // can castle not including through check
                    // check if castling through check
                    let newBoard = clone(chessBoard)
                    newBoard[yVal][xVal - 1] = clone(clickedPiece)
                    newBoard[yVal][xVal] = "NA"
                    if (!inCheck(newBoard, clickedPiece.team)) {
                        newBoard[yVal][xVal - 2] = clone(clickedPiece)
                        newBoard[yVal][xVal - 1] = "NA"
                        if (!inCheck(newBoard, clickedPiece.team)) {
                            locations.push([xVal - 2, yVal, false])
                        }
                    }
                }
            }
        }
    }
    return locations;
}

function checkIfGameOver() {
    if (inCheckMate(!turn)) {
        appendToMove('#')
        return true;
    }
    else if (inStaleMate(!turn)) {
        return true;
    }
    else return fiftyMoveRuleCountDown === 0;
}

function writePGN() {
    let output = ""
    pgnMeta.forEach(metaItem => {
        output += "[" + metaItem + " \"" + pgnMetaValues[metaItem] + "\"]\n"
    })
    output += "\n"
    output += pgnText
    pgnDownload = output
}

function inCheck(board, team) {
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (board[y][x] !== "NA" && board[y][x].piece === 'k' && board[y][x].team === team) {
                let vectors;
                //diagonal
                vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1]]
                if (checkRayCastVectorsForPieces(vectors, ['b', 'q'], board, team, [x, y])) {
                    return true;
                }
                //straight
                vectors = [[0, 1], [1, 0], [0, -1], [-1, 0]]
                if (checkRayCastVectorsForPieces(vectors, ['r', 'q'], board, team, [x, y])) {
                    return true;
                }
                //knight
                vectors = [[2, 1], [1, 2], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
                if (checkVectorsForPieces(vectors, ['n'], board, team, [x, y])) {
                    return true;
                }
                //king
                vectors = [[1, 1], [1, -1], [-1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]]
                if (checkVectorsForPieces(vectors, ['k'], board, team, [x, y])) {
                    return true
                }
                (team) ? vectors = [[1, -1], [-1, -1]] : vectors = [[1, 1], [-1, 1]]
                if (checkVectorsForPieces(vectors, ['p'], board, team, [x, y])) {
                    return true
                }
            }
        }
    }
    return false;
}

function inCheckMate(team) {
    if (inCheck(chessBoard, team)) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (chessBoard[y][x] !== "NA" && chessBoard[y][x].team === team) {
                    let locations = movesOfPiece(x, y, chessBoard[y][x])
                    for (let i = 0; i < locations.length; i++) {
                        let newBoard = clone(chessBoard)
                        newBoard[locations[i][1]][locations[i][0]] = clone(newBoard[y][x])
                        newBoard[y][x] = "NA"
                        if (locations[i].length === 3 && locations[i][2]) {
                            // ENPASSANT
                            newBoard[y][locations[i][0]] = "NA"
                        }
                        if (!inCheck(newBoard, team)) {
                            return false;
                        }
                    }
                }
            }
        }
    } else {
        return false;
    }
    return true;
}

function appendToMove(string, moveNumber = moveNum) {
    let element = $("#move" + (moveNumber))
    element.text(element.text() + string)
    pgnText = pgnText.slice(0, -1);
    pgnText += string + " "
    writePGN()
}

function appendMoveToList(startingPos, newPosition, isEnpassant, timerInfo, promotionChoice = false) {
    let movedPiece = chessBoard[startingPos[1]][startingPos[0]]
    let text = ""
    if (movedPiece.piece === 'p') {
        //pawn move
        fiftyMoveRuleCountDown = 50
        if (chessBoard[newPosition[1]][newPosition[0]] !== 'NA' || isEnpassant) {
            // capture
            text = text.concat(toChessNotation.x[startingPos[0]] + "x")
        }
        text = text.concat(toChessNotation.x[newPosition[0]] + toChessNotation.y[newPosition[1]])
        if (promotionChoice !== false) {
            text = text.concat("=" + promotionChoice[0].toUpperCase())
        }
    } else {
        if (movedPiece.piece === 'k' && Math.abs(startingPos[0] - newPosition[0]) === 2) {
            if (startingPos[0] > newPosition[0]) {
                // castle left
                text = "O-O-O"
            } else {
                // castle right
                text = "O-O"
            }
        } else {
            let sameX = false;
            let sameY = false;
            let piecesInDoubt = []
            // check if any other piece can the move
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    if (chessBoard[y][x] !== "NA" && chessBoard[y][x].code === movedPiece.code && (x !== startingPos[0] || y !== startingPos[1])) {
                        let moves = movesOfPiece(x, y, chessBoard[y][x])
                        for (let i = 0; i < moves.length; i++) {
                            if (moves[i][0] === newPosition[0] && moves[i][1] === newPosition[1]) {
                                piecesInDoubt.push([x, y])
                            }
                        }
                    }
                }
            }
            if (piecesInDoubt.length > 0) {
                for (let i = 0; i < piecesInDoubt.length; i++) {
                    if (piecesInDoubt[i][0] === startingPos[0]) {
                        sameX = true
                    }
                    else if (piecesInDoubt[i][1] === startingPos[1]) {
                        sameY = true
                    }
                    else {
                        sameY = true
                    }
                }
            }
            text = text.concat(movedPiece.piece.toUpperCase())
            if (sameY) {
                text = text.concat(toChessNotation.x[startingPos[0]])
            }
            if (sameX) {
                text = text.concat(toChessNotation.y[startingPos[1]])
            }
            if (chessBoard[newPosition[1]][newPosition[0]] !== 'NA' || isEnpassant) {
                //capture
                fiftyMoveRuleCountDown = 50
                text = text.concat("x")
            }
            text = text.concat(toChessNotation.x[newPosition[0]] + toChessNotation.y[newPosition[1]])
        }
    }
    // Update Timer
    let timeTaken = Math.round(((new Date()).getTime() - previousMoveTime) / 100) / 10
    previousMoveTime = new Date().getTime()

    if (turn) {
        // white so new line
        pgnText += (moveNum / 2 + 1) + ". " + text + " "
        moveList.append("<tr>\n" +
            "   <td>" + (moveNum / 2 + 1) + "</td>\n" +
            "   <td onclick='goToMove(" + (moveNum + 1) + ")'><span id='move" + moveNum + "'>" + text + "</span> <span id='timerMove" + moveNum + "' class='time_taken'>" + timeTaken + "</span></td>\n" +
            "   <td><span id='move" + (moveNum + 1) + "'>" + text + "</span> <span id='timerMove" + (moveNum + 1) + "' class='time_taken'></span></td>\n" +
            "</tr>")
    } else {
        //black turn so edit td - id moveNum
        pgnText += text + " "
        let element = $("#move" + moveNum)
        let timeElement = $("#timerMove" + moveNum)
        timeElement.text(timeTaken)
        element.text(text)
        element.attr("onclick", "goToMove(" + (moveNum + 1) + ")")
    }
    writePGN()
}

function goToMove(moveNumber) {
    showingBoard = moveNumber
    drawCurrentBoard = (moveNum === showingBoard);
    let boardSelected = boardAtMove[moveNumber]
    if (boardSelected.hasOwnProperty('startPos'))
        oldPos = boardSelected.startPos
    else
        oldPos = null
    
    if (boardSelected.hasOwnProperty('endingPos'))
        pieceMoved = boardSelected.endingPos
    else
        pieceMoved = null

    if (oldPos !== null) {
        if (ownTeam === null)
            drawBoard(boardSelected.board, showingBoard, boardSelected.board[boardSelected.endingPos[1]][boardSelected.endingPos[0]].team)
        else
            drawBoard(boardSelected.board, showingBoard)
    } else {
        drawBoard(boardSelected.board, showingBoard)
    }

    $("#resume_game").show()
}

function inStaleMate(team) {
    if (!inCheck(chessBoard, team)) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (chessBoard[y][x] !== "NA" && chessBoard[y][x].team === team) {
                    let locations = movesOfPiece(x, y, chessBoard[y][x])
                    for (let i = 0; i < locations.length; i++) {
                        let newBoard = clone(chessBoard)
                        newBoard[locations[i][1]][locations[i][0]] = clone(newBoard[y][x])
                        newBoard[y][x] = "NA"
                        if (locations[i].length === 3 && locations[i][2]) {
                            // ENPASSANT
                            newBoard[y][locations[i][0]] = "NA"
                        }
                        if (!inCheck(newBoard, team)) {
                            return false;
                        }
                    }
                }
            }
        }
    } else {
        return false;
    }
    return true;
}

function checkVectorsForPieces (vectors, pieces, board, team, coords) {
    for (let v = 0; v < vectors.length; v++) {
        // if in bounds
        if (coords[0] + vectors[v][0] >= 0 && coords[0] + vectors[v][0] <= 7 && coords[1] + vectors[v][1] >= 0 && coords[1] + vectors[v][1] <= 7) {
            if (board[coords[1] + vectors[v][1]][coords[0] + vectors[v][0]] !== "NA") {
                // if on other team
                if (team !== board[coords[1] + vectors[v][1]][coords[0] + vectors[v][0]].team) {
                    // if designated piece
                    for (let i = 0; i < pieces.length; i++) {
                        if (board[coords[1] + vectors[v][1]][coords[0] + vectors[v][0]].piece === pieces[i]) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function checkRayCastVectorsForPieces (vectors, pieces, board, team, coords) {
    for (let v = 0; v < vectors.length; v++) {
        let vectorToCalc = [vectors[v][0], vectors[v][1]]
        let validVector = true;
        while (validVector) {
            // if in bounds
            if (coords[0] + vectorToCalc[0] >= 0 && coords[0] + vectorToCalc[0] <= 7 && coords[1] + vectorToCalc[1] >= 0 && coords[1] + vectorToCalc[1] <= 7) {
                if (board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]] !== "NA") {
                    if (team === board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]].team) {
                        validVector = false;
                    } else if (team !== board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]].team) {
                        for (let i = 0; i < pieces.length; i++) {
                            if (board[coords[1] + vectorToCalc[1]][coords[0] + vectorToCalc[0]].piece === pieces[i]) {
                                return true;
                            }
                        }
                        validVector = false;
                    }
                }
            } else {
                validVector = false;
            }
            vectorToCalc[0] += vectors[v][0]
            vectorToCalc[1] += vectors[v][1]
        }
    }
    return false;
}

function getVectorsAbsolute(xVal, yVal, vectors, team) {
    let locations = []
    vectors.forEach(vector => {
        if (xVal + vector[0] >= 0 && xVal + vector[0] <= 7 && yVal + vector[1] >= 0 && yVal + vector[1] <= 7 && (chessBoard[yVal + vector[1]][xVal + vector[0]] === 'NA' || team !== chessBoard[yVal + vector[1]][xVal + vector[0]].team)) {
            locations.push([xVal + vector[0], yVal + vector[1]])
        }
    })
    return locations
}

var ownTeam = null;
let previousBoardOrientation = false
var lastMoveType = 'self'
var lastMoveNum = 0

function drawBoard(board = chessBoard, moveNumber = moveNum, turnToCheck = null) {
    finishAnimations()
    if (animationInterval !== null)
        clearInterval(animationInterval)
    let moveType = "self"
    if ((turnToCheck === null && pieceMoved !== null && board[pieceMoved[1]][pieceMoved[0]].team !== ownTeam) || (turnToCheck !== null && !turnToCheck)) moveType = "other"
    // resizeCheck()
    let extraPieces = []
    let needPieces = []
    for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
            let isDifferent = false;
            const newBoardPos = board[y][x]
            const oldBoardPos = reDrawBoard[y][x]
            if (newBoardPos === 'NA' && oldBoardPos !== 'NA') isDifferent = true
            if (newBoardPos !== 'NA' && oldBoardPos === 'NA') isDifferent = true
            if (newBoardPos !== 'NA' && oldBoardPos !== 'NA' && newBoardPos.code !== oldBoardPos.code) isDifferent = true
            if (isDifferent || (previousBoardOrientation !== flipBoard)) {
                if (newBoardPos !== 'NA') needPieces.push([x, y])
                if (oldBoardPos !== 'NA') extraPieces.push([x, y])
            }
        }

    let piecesToAdd = []
    let piecesToTranslate = [] 
    for (let i = 0; i < needPieces.length; i++) {
        const needPiecePos = needPieces[i]
        const pieceCode = board[needPiecePos[1]][needPiecePos[0]].code
        let foundPieceToMove = false
        for (let j = 0; j < extraPieces.length; j++) {
            const extraPieceCode = reDrawBoard[extraPieces[j][1]][extraPieces[j][0]].code
            if (extraPieceCode === pieceCode) {
                piecesToTranslate.push({
                    "elem": $("#piece" + extraPieces[j][0] + extraPieces[j][1]),
                    "startingPos": ((previousBoardOrientation !== flipBoard && flipBoard) || (previousBoardOrientation === flipBoard && !flipBoard)) ? [(extraPieces[j][0] * boxSize), (extraPieces[j][1] * boxSize)] : [((7 - extraPieces[j][0]) * boxSize), ((7 - extraPieces[j][1]) * boxSize)],
                    "endingPos": (!flipBoard) ? [(needPiecePos[0] * boxSize), (needPiecePos[1] * boxSize)] : [((7 - needPiecePos[0]) * boxSize), ((7 - needPiecePos[1]) * boxSize)],
                    "newId": 'piece' + needPiecePos[0] + needPiecePos[1],
                    "onClickPos": needPiecePos[0] + ', ' + needPiecePos[1],
                    "frame": 0
                })
                foundPieceToMove = true
                extraPieces.splice(j, 1)
                break;
            }
        }
        if (!foundPieceToMove) piecesToAdd.push('<piece class="' +
            pieceCode[0] + ' ' + pieceCode[1] + '" id="piece' + 
            needPiecePos[0] + needPiecePos[1] + 
            '" onclick="pieceClicked(' + needPiecePos[0] + ', ' + needPiecePos[1] + 
            `)" draggable="false" style="transform: translate(${(!flipBoard) ? (needPiecePos[0] * boxSize) + 'px, ' + (needPiecePos[1] * boxSize) :
            ((7 - needPiecePos[0]) * boxSize) + 'px, ' + ((7 - needPiecePos[1]) * boxSize)}px);"></piece`)
    }
    for (let i = 0; i < extraPieces.length; i++) {
        const pieceToDelete = $("#piece" + extraPieces[i][0] + extraPieces[i][1])
        pieceToDelete.remove()
    }

    piecesToTranslate.forEach(pieceToTranslate => {
        pieceToTranslate.elem.attr('id', pieceToTranslate.newId)
        pieceToTranslate.elem.attr('onclick', `pieceClicked(${pieceToTranslate.onClickPos})`)
    })

    animations = piecesToTranslate

    piecesToAdd.forEach(pieceToAdd => {
        piecesLayer.append(pieceToAdd)
    })
    $('highlightedtile').remove()
    // $('piece').removeClass('piece_moved_self piece_moved_other')
    if (pieceMoved !== null) {
        // $("#piece" + pieceMoved[0] + pieceMoved[1]).addClass("piece_moved_" + moveType)
        piecesLayer.append(`<highlightedtile draggable="false" class="previous_place_${moveType}" style="transform: translate(${(!flipBoard) ? (oldPos[0] * boxSize) + 'px, ' + (oldPos[1] * boxSize) : ((7 - oldPos[0]) * boxSize) + 'px, ' + ((7 - oldPos[1]) * boxSize)}px);"></highlightedtile>`)
        piecesLayer.append(`<highlightedtile draggable="false" class="piece_moved_${moveType}" style="transform: translate(${(!flipBoard) ? (pieceMoved[0] * boxSize) + 'px, ' + (pieceMoved[1] * boxSize) : ((7 - pieceMoved[0]) * boxSize) + 'px, ' + ((7 - pieceMoved[1]) * boxSize)}px);"></highlightedtile>`)
    }
    reDrawBoard = clone(board)
    animationInterval = setInterval(updateAnimations, 10)
    previousBoardOrientation = flipBoard
    lastMoveType = moveType
    lastMoveNum = moveNumber
    if (pieceMoved !== null) {
        FENdisplay.text(getFENofBoard(board, board[pieceMoved[1]][pieceMoved[0]].team, moveNumber, 0, chessMode === 'standard'))
    } else {
        console.log(getFENofBoard(board, true, moveNumber, 0, chessMode === 'standard'))
        FENdisplay.text(getFENofBoard(board, true, moveNumber, 0, chessMode === 'standard'))
    }

}


resizeCheck()
window.addEventListener("resize", function() {
    valid_positions.empty()
    resizeCheck()
});

function rayCastVectors(xVal, yVal, vectors, clickedPiece) {
    let locations = []
    for (let v = 0; v < vectors.length; v++) {
        let vectorToCalc = [vectors[v][0], vectors[v][1]]
        let validVector = true;
        while (validVector) {
            if (xVal + vectorToCalc[0] >= 0 && xVal + vectorToCalc[0] <= 7 && yVal + vectorToCalc[1] >= 0 && yVal + vectorToCalc[1] <= 7) {
                if (chessBoard[yVal + vectorToCalc[1]][xVal + vectorToCalc[0]] === 'NA') {
                    locations.push([xVal + vectorToCalc[0], yVal + vectorToCalc[1]])
                } else if (clickedPiece.team !== chessBoard[yVal + vectorToCalc[1]][xVal + vectorToCalc[0]].team) {
                    locations.push([xVal + vectorToCalc[0], yVal + vectorToCalc[1]])
                    validVector = false;
                } else {
                    validVector = false;
                }
            } else {
                validVector = false;
            }
            vectorToCalc[0] += vectors[v][0]
            vectorToCalc[1] += vectors[v][1]
        }
    }
    return locations;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
}

// Download function found on https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function download(filename) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pgnDownload));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
