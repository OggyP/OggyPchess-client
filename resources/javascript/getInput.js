// Deal with keyboard input
window.addEventListener("keydown", function(event) {
    if (mode === "login") {
        if (event.key === "Enter") {
            login()
        }
    } else if (mode === "register") {
        if (event.key === "Enter") {
            register()
        }
    }
}, true);

// keyboard input
window.addEventListener("keydown", function(event) {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    if (event.key === "ArrowLeft") {
        if (drawCurrentBoard) {
            showingBoard = moveNum - 1
        } else {
            showingBoard--
        }
        if (showingBoard >= 0) {
            goToMove(showingBoard)
        } else {
            showingBoard = 0
            goToMove(showingBoard)
        }
    }

    if (event.key === "ArrowDown") {
        showingBoard = 0
        goToMove(showingBoard)
    }

    if (event.key === "ArrowUp") {
        showingBoard = moveNum
        goToMove(showingBoard)
        $('#resume_game').hide()
    }

    if (event.key === "ArrowRight") {
        if (!drawCurrentBoard) {
            showingBoard++
            if (showingBoard > moveNum) {
                showingBoard = moveNum
                return
            }
            if (showingBoard === moveNum) {
                showingBoard = moveNum
                let boardSelected = boardAtMove[moveNum]
                if (boardSelected.hasOwnProperty('audio')) {
                    let audioToPlay = audio[boardSelected.audio]
                    audioToPlay.currentTime = 0
                    audioToPlay.play()
                }
                drawCurrentBoard = true;
                oldPos = boardSelected.startPos
                pieceMoved = boardSelected.endingPos
                if (ownTeam === null)
                    drawBoard(chessBoard, showingBoard, boardSelected.board[boardSelected.endingPos[1]][boardSelected.endingPos[0]].team)
                else
                    drawBoard()
                $('#resume_game').hide()
            } else {
                goToMove(showingBoard)
            }
        }
    }
}, true);

var currentMousePos = { x: -1, y: -1 };
$(document).mousemove(function(event) {
    // console.log("Mouse Moved")
    currentMousePos.x = event.pageX;
    currentMousePos.y = event.pageY;
});

var pieceBeingDragged = null

function mouseDown(obj) {
    if (drawCurrentBoard && !importedPGN) {
        if (pieceBeingDragged !== null) mouseUp()
            // console.log("DOWN")
            // console.log(obj.id)
        pieceBeingDragged = {
            "elem": $("#" + obj.id),
            "pos": {
                "x": Number(obj.id[5]),
                "y": Number(obj.id[6])
            }
        }
        pieceBeingDragged.elem.addClass("dragged")
        pieceClicked(pieceBeingDragged.pos.x, pieceBeingDragged.pos.y)
        pieceBeingDragged.elem.css("opacity", "1")
        draggingUpdateInterval = setInterval(movePiece, 3)
    }
}

document.addEventListener("mouseup", mouseUp);

function mouseUp() {
    if (pieceBeingDragged !== null) {
        pieceBeingDragged.elem.css("opacity", "0.6")
        pieceBeingDragged.elem.removeClass("dragged")
            // console.log("UP")
        let chessBoardMousePos = getMousePosOnChessBoard()
        let dropPos = {
                'x': Math.floor(chessBoardMousePos.x / boxSize),
                'y': Math.floor(chessBoardMousePos.y / boxSize)
            }
            // console.log(dropPos)
        if (flipBoard) {
            dropPos.x = 7 - dropPos.x
            dropPos.y = 7 - dropPos.y
        }
        if (dropPos.x === pieceBeingDragged.pos.x && dropPos.y === pieceBeingDragged.pos.y) {
            pieceBeingDragged.elem.css("transform", (!flipBoard) ? `translate(${pieceBeingDragged.pos.x * boxSize}px, ${pieceBeingDragged.pos.y * boxSize}px)` : `translate(${(7 - pieceBeingDragged.pos.x) * boxSize}px, ${(7 - pieceBeingDragged.pos.y) * boxSize}px)`)
        } else {
            let foundValidPos = false
            for (let i = 0; i < validMoves.length; i++) {
                let positionToCheck = validMoves[i]
                if (positionToCheck.x === dropPos.x && positionToCheck.y === dropPos.y) {
                    // console.log(positionToCheck)
                    if (positionToCheck.hasOwnProperty('specialCase'))
                        pieceMove(positionToCheck.x, positionToCheck.y, positionToCheck.specialCase)
                    else
                        pieceMove(positionToCheck.x, positionToCheck.y)
                    foundValidPos = true
                    break
                }
            }
            if (!foundValidPos) {
                pieceBeingDragged.elem.css("transform", (!flipBoard) ? `translate(${pieceBeingDragged.pos.x * boxSize}px, ${pieceBeingDragged.pos.y * boxSize}px)` : `translate(${(7 - pieceBeingDragged.pos.x) * boxSize}px, ${(7 - pieceBeingDragged.pos.y) * boxSize}px)`)
            }
        }
        pieceBeingDragged = null
        if (draggingUpdateInterval !== null) clearInterval(draggingUpdateInterval)
    }
}

draggingUpdateInterval = null

function movePiece(piece = pieceBeingDragged) {
    if (piece !== null) {
        let chessBoardPos = getMousePosOnChessBoard();
        // console.log(chessBoardPos)
        // console.log((new Date).getTime())
        piece.elem.css("transform", `translate(${chessBoardPos.x - boxSize / 2}px, ${chessBoardPos.y - boxSize / 2}px)`)
    }
}

function getMousePosOnChessBoard() {
    var offset = $("#chess_board").offset();
    return {
        x: currentMousePos.x - offset.left,
        y: currentMousePos.y - offset.top
    };
}