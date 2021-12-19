// Deal with keyboard input
window.addEventListener("keydown", function (event) {
    if (mode === "login") {
        if (event.key === "Enter") {
            console.log("Enter Pressed")
            login()
        }
    }
    else if (mode === "register") {
        if (event.key === "Enter") {
            console.log("Enter Pressed")
            register()
        }
    }
}, true);

// keyboard input
window.addEventListener("keydown", function (event) {
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
    }

    if (event.key === "ArrowRight") {
        console.log(showingBoard)
        if (!drawCurrentBoard) {
            showingBoard ++
            if (showingBoard === moveNum) {
                drawCurrentBoard = true;
                oldPos = boardAtMove[moveNum].startPos
                pieceMoved = boardAtMove[moveNum].endingPos
                if (ownTeam === null)
                    drawBoard(chessBoard, boardAtMove[moveNum].board[boardAtMove[moveNum].endingPos[1]][boardAtMove[moveNum].endingPos[0]].team)
                else
                    drawBoard()
                $('#resume_game').hide()
            } else {
                goToMove(showingBoard)
            }
        }
    }
}, true);