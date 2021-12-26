
type PieceCodes = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type Teams = 'white' | 'black';

class ChessPiece {
    team: Teams;
    hasSpecialCase: boolean;
    code: PieceCodes;

    constructor(team: Teams, pieceCode: PieceCodes) {
        this.team = team;
        this.code = pieceCode;
    }

    getTeam(): Teams {
        return this.team;
    }
}

interface Vector {
    x: number;
    y: number;
}

interface VectorsAndPieces {
    pieces: ChessPiece[];
    vectors: Vector[];
}

interface CastleInfo {
    kingSide: boolean;
    queenSide: boolean;
}

class RayCastPiece {
    test: boolean;

    static rayCastVectors(board: Board, vectors: Vector[], position: Vector, team: Teams): VectorsAndPieces {
        let validVectors: Vector[] = []
        let collidedPieces: ChessPiece[] = []
        for (let i = 0; i < vectors.length; i++) {
            let vector = vectors[i];
            let currentCoords: Vector = {
                "x": vector.x + position.x,
                "y": vector.y + position.y
            }
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
    constructor(team: Teams) {
        super(team, 'q')
    }
}

class King extends ChessPiece {
    constructor(team: Teams) {
        super(team, 'k')
    }
}

class Bishop extends ChessPiece {
    constructor(team: Teams) {
        super(team, 'b')
    }
}

class Knight extends ChessPiece {
    constructor(team: Teams) {
        super(team, 'n')
    }
}

class Rook extends ChessPiece {
    constructor(team: Teams) {
        super(team, 'r')
    }
}

class Pawn extends ChessPiece {
    constructor(team: Teams) {
        super(team, 'p')
    }
}

const pieceCodeClasses = {
    "q": Queen,
    "k": King,
    "b": Bishop,
    "n": Knight,
    "r": Rook,
    "p": Pawn
}