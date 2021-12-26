class ChessPiece {
    constructor(team, pieceCode) {
        this.team = team;
        this.code = pieceCode;
    }
    getTeam() {
        return this.team;
    }
}
class RayCastPiece {
    static rayCastVectors(board, vectors, position, team) {
        let validVectors = [];
        let collidedPieces = [];
        for (let i = 0; i < vectors.length; i++) {
            let vector = vectors[i];
            let currentCoords = {
                "x": vector.x + position.x,
                "y": vector.y + position.y
            };
            let vectorValid = true;
            while (vectorValid && currentCoords.x >= 0 && currentCoords.y >= 0 && currentCoords.x < 8 && currentCoords.y < 8) {
                if (board)
                    currentCoords.x += vector.x;
                currentCoords.y += vector.y;
            }
        }
        return {
            "pieces": collidedPieces,
            "vectors": validVectors
        };
    }
}
class Queen extends ChessPiece {
    constructor(team) {
        super(team, 'q');
    }
}
class King extends ChessPiece {
    constructor(team) {
        super(team, 'k');
    }
}
class Bishop extends ChessPiece {
    constructor(team) {
        super(team, 'b');
    }
}
class Knight extends ChessPiece {
    constructor(team) {
        super(team, 'n');
    }
}
class Rook extends ChessPiece {
    constructor(team) {
        super(team, 'r');
    }
}
class Pawn extends ChessPiece {
    constructor(team) {
        super(team, 'p');
    }
}
const pieceCodeClasses = {
    "q": Queen,
    "k": King,
    "b": Bishop,
    "n": Knight,
    "r": Rook,
    "p": Pawn
};
