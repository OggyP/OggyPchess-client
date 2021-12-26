class Game {
    board: Board;
}

class Board {
    private _squares: Array<Array<ChessPiece>>;
    turn: Teams;


    constructor(FEN: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
        // Create an empty board
        this._squares = []
        for (let i = 0; i < 8; i++)
            this._squares.push([])
        let FENparts = FEN.split(' ')
        let rows = FENparts[0].split('/')
        if (rows.length !== 8)
            throw new Error("Invalid FEN, there needs to be 8 rows specified.")
        for (let rowNum = 0; rowNum < 8; rowNum++) {
            let row = rows[rowNum]
            for (let i = 0; i < row.length; i++) {
                let char = row[i]
                if (!isNaN(Number(char))) {
                    // Fill with null for specified amount
                    for (let j = 0; j < Number(char); j++) {
                        this._squares[rowNum].push(null)
                    }
                } else {
                    console.log()
                    let lowerCaseChar = char.toLowerCase()
                    if (pieceCodeClasses[lowerCaseChar] !== undefined)
                        if (char.toUpperCase() === char) { // row[i] is upper case
                            // Piece is white
                            this._squares[rowNum].push(new pieceCodeClasses[lowerCaseChar]("white"))
                        } else {
                            // Piece is black
                            this._squares[rowNum].push(new pieceCodeClasses[lowerCaseChar]("black"))
                        }
                }
            }
        }
    }

    getPos(position: Vector): ChessPiece {
        return this._squares[position.y][position.x]
    }
}

type Notation = string | [number, number];

function swapNotation(notation: Notation): Notation {
    if (typeof notation === "string")
        // From Chess Notation to Board Coords
        return [parseInt(notation[0], 36) - 10, 8 - Number(notation[1])]
    else
        // To Chess Notation from Board Coords
        return String.fromCharCode(97 + notation[0]) + (8 + notation[1]);
}