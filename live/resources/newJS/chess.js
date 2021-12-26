class Game {
}
class Board {
    constructor(FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
        this.enPassant = null;
        this.castleInfo = {
            "white": { "kingSide": false, "queenSide": false },
            "black": { "kingSide": false, "queenSide": false }
        };
        // Create an empty board
        this._squares = [];
        for (let i = 0; i < 8; i++)
            this._squares.push([]);
        let FENparts = FEN.split(' ');
        if (FENparts.length !== 6)
            throw new Error("Invalid FEN, There should be 6 segments.");
        // Set Turn
        this.turn = (FENparts[1] === 'w') ? "white" : "black";
        // Set Castling
        for (let i = 0; i < FENparts[2].length; i++) {
            let char = FENparts[2][i];
            if (char !== '-') {
                let teamOfCastlingInfo = (char === char.toUpperCase()) ? "white" : "black";
                let sideOfCastlingInfo = (char.toLowerCase() === 'k') ? "kingSide" : "queenSide";
                this.castleInfo[teamOfCastlingInfo][sideOfCastlingInfo] = true;
            }
        }
        // Set Enpassant
        if (FENparts[3] !== '-')
            this.enPassant = convertToPosition(FENparts[3]);
        // Set Pieces
        let rows = FENparts[0].split('/');
        if (rows.length !== 8)
            throw new Error("Invalid FEN, there needs to be 8 rows specified.");
        for (let rowNum = 0; rowNum < 8; rowNum++) {
            let row = rows[rowNum];
            for (let i = 0; i < row.length; i++) {
                let char = row[i];
                if (!isNaN(Number(char))) {
                    // Fill with null for specified amount
                    for (let j = 0; j < Number(char); j++) {
                        this._squares[rowNum].push(null);
                    }
                }
                else {
                    console.log();
                    let lowerCaseChar = char.toLowerCase();
                    if (pieceCodeClasses[lowerCaseChar] !== undefined)
                        if (char.toUpperCase() === char) { // row[i] is upper case
                            // Piece is white
                            this._squares[rowNum].push(new pieceCodeClasses[lowerCaseChar]("white"));
                        }
                        else {
                            // Piece is black
                            this._squares[rowNum].push(new pieceCodeClasses[lowerCaseChar]("black"));
                        }
                }
            }
        }
    }
    getPos(position) {
        return this._squares[position.y][position.x];
    }
}
function convertToChessNotation(position) {
    return String.fromCharCode(97 + position[0]) + (8 + position[1]);
}
function convertToPosition(notation) {
    return { "x": parseInt(notation[0], 36) - 10, "y": 8 - Number(notation[1]) };
}
