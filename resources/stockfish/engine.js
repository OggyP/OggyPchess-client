var engine = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || 'resources/stockfish/stockfish.js');
var evaler = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || 'resources/stockfish/stockfish.js');

var evalerCommandsToSend = []

function uciCmd(cmd, which) {
    console.log("UCI: " + cmd);

    if (cmd === 'isready') {waitingForReady = true}
    
    (which || engine).postMessage(cmd);
}

uciCmd("uci", evaler)

let evalerInfo = {"uciReady": false, 'options': [], "lastEvaluation":"", "isEvaluating": false, "lastBestMove":""}

function goToDepth(fenPosition, depth) {
    if (evalerInfo.isEvaluating) {
        evalerCommandsToSend.push('stop')
    }
    evalerCommandsToSend.push('isready')
    evalerCommandsToSend.push("position fen " + fenPosition)
    evalerCommandsToSend.push("go depth " + depth)
    evalerInfo.isEvaluating = true
    uciCmd(evalerCommandsToSend.shift(), evaler)
}

const infoTypes = ['depth', 'seldepth', 'multipv', 'score', 'nodes', 'nps', 'hashfull', 'tbhits', 'time', 'pv', 'string']
function parseInfoLine(line, turn) {
    let info = {}
    let currentInfoType = ''
    let words = line.split(' ')
    for (let i = 0; i < words.length; i++) {
        let word = words[i]
        if (word === 'info') continue
        if (infoTypes.includes(word)) {
            currentInfoType = word
            continue
        }
        if (info.hasOwnProperty(currentInfoType)) {
            let wordToAdd = word
            if (currentInfoType === 'score' && !turn)
                if (!isNaN(wordToAdd)) wordToAdd = -Number(wordToAdd)
            info[currentInfoType] += ' ' + wordToAdd
        } else {
            info[currentInfoType] = word
        }
    }
    return info
}

var evaluationTurn = true
const evaluationTextDisplay = $("#eveluation")
var waitingForReady = false
var clearUntilReady = false
evaler.onmessage = function(event) {
    var line;
    
    if (event && typeof event === "object") {
        line = event.data;
    } else {
        line = event;
    }

    console.log("evaler: " + line);

    // if (line.startsWith('option')) {
    //     let newOption = {}
    //     let words = line.split(' ')
    //     let keyWordTypes = ['name', 'type', 'default']
    //     let currentType 
    //     words.forEach(word => {
    //         if (word === 'option') continue
    //         if (keyWordTypes.includes(word)) {
    //             currentType = word
    //             newOption[currentType] = []
    //         } else {
    //             newOption[currentType].push(word)
    //         }
    //     })
    // }

    if (line === 'readyok') {
        waitingForReady = false
        clearUntilReady = false
    }

    if (waitingForReady) {
        console.log("returned")
        return
    }

    if (line === 'uciok') {
        evalerInfo.uciReady = true
        uciCmd("setoption name UCI_AnalyseMode value true", evaler)
        uciCmd("ucinewgame", evaler)
    }

    if (line.startsWith('info') && line.split(' ')[3] !== 'currmove') {
        evalerInfo.lastEvaluation = line
        let parsedLineInfo = parseInfoLine(line, evaluationTurn)
        console.log(parsedLineInfo)
        if (parsedLineInfo.hasOwnProperty('score')) evaluationTextDisplay.text(`Depth: ${parsedLineInfo.depth} | Score: ${parsedLineInfo.score.replace('upperbound', '').replace('lowerbound', '')}`)
        if (parsedLineInfo.hasOwnProperty('pv')) showBestMove(parsedLineInfo.pv.split(' ')[0])
    }
    if (line.startsWith('bestmove')) { 
        evalerInfo.lastBestMove = line.split(' ')[1]
        console.log("Best Move " + line)
        if (importedPGN || (adminUserIds.includes(ownUserId))) showBestMove(evalerInfo.lastBestMove)
        evalerInfo.isEvaluating = false
    }

    if (clearUntilReady) {
        $('.best_move').remove()
        console.log("Cleared Best Move Square")
    }

    while (evalerCommandsToSend.length > 0 && !waitingForReady) {
        uciCmd(evalerCommandsToSend.shift(), evaler)
    }
}

function showBestMove(move) {
    if (!clearUntilReady) {
        $('.best_move').remove()
        if (move !== '(none)') {
            console.log("Draw Best Move Square")
            let startingPos = [fromChessNotation.x[move[0]], fromChessNotation.y[move[1]]]
            let endingPos = [fromChessNotation.x[move[2]], fromChessNotation.y[move[3]]]
            piecesLayer.append(`<square draggable="false" class="best_move best_move_start" style="transform: translate(${(!flipBoard) ? (startingPos[0] * boxSize) + 'px, ' + (startingPos[1] * boxSize) : ((7 - startingPos[0]) * boxSize) + 'px, ' + ((7 - startingPos[1]) * boxSize)}px);"></square>`)
            piecesLayer.append(`<square draggable="false" class="best_move best_move_end" style="transform: translate(${(!flipBoard) ? (endingPos[0] * boxSize) + 'px, ' + (endingPos[1] * boxSize) : ((7 - endingPos[0]) * boxSize) + 'px, ' + ((7 - endingPos[1]) * boxSize)}px);"></square>`)
        }
    }
}

function stopSearching() {
    if (evalerInfo.isEvaluating)  {
        uciCmd("stop", evaler)
        evalerInfo.isEvaluating = false
    }
}

engine.onmessage = function(event) {
    var line;
    
    if (event && typeof event === "object") {
        line = event.data;
    } else {
        line = event;
    }
    console.log("Reply: " + line)
}