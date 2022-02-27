let squareSize = 10
const piecesLayer = $('#pieces_layer')
const validPositions = $('#valid_positions')
console.log(resizeCheck())

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
    validPositions.width(minSize)
    validPositions.height(minSize)
    squareSize = minSize / 8
    return minSize
}

class Piece {
	constructor(pos) {
		this.pos = pos
		this.direction = []
		this.colour = 'b'
		this.moves = []
	}
	
	update() {
		let newX = this.pos[0] + this.direction[0]
		let newY = this.pos[1] + this.direction[1]
		
		if ((newX >= 0 && newX < 8) && (newY >= 0 && newY < 8)) {
			if (board[newY][newX] === null) {
				board[newY][newX] = this
				board[this.pos[1]][this.pos[0]] = null
				this.pos = [newX, newY]
			}
			else {
				if (board[newY][newX].colour === 'w') {
					let captureSquares = this.moves  // if the piece can capture the white piece
					captureSquares.forEach(square => {
						if (square[0] === newX && square[1] === newY) {
							board[newY][newX] = this
							board[this.pos[1]][this.pos[0]] = null
							this.pos = [newX, newY]
						}
					})
				}
			}
		}

		else {
			board[this.pos[1]][this.pos[0]] = null
			this.moves = []
		}
	}
}
	
	
class Pawn extends Piece {
	constructor(pos) {
		super(pos)
		this.code = 'p'
	}
	
	getMoves() {
		let vectors = [[-1, -1], [1, -1]]
		let targetSquares = []
		vectors.forEach(vector => {
			let targetSquare = [this.pos[0] + vector[0], this.pos[1] + vector[1]]
			if ((targetSquare[0] >= 0 && targetSquare[0] < 8) && (targetSquare[1] >= 0 && targetSquare[1] < 8)) {
				if (board[targetSquare[1]][targetSquare[0]] === null) {
					targetSquares.push(targetSquare)
				}
			}
		})
		
		this.moves = targetSquares
	}
}


class Knight extends Piece {
	constructor(pos) {
		super(pos)
		this.code = 'n'
	}
	
	getMoves() {
		let vectors = [[-1, -2], [1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1]]
		let targetSquares = []
		vectors.forEach(vector => {
			let targetSquare = [this.pos[0] + vector[0], this.pos[1] + vector[1]]
			if ((targetSquare[0] >= 0 && targetSquare[0] < 8) && (targetSquare[1] >= 0 && targetSquare[1] < 8)) {
				if (board[targetSquare[1]][targetSquare[0]] === null) {
					targetSquares.push(targetSquare)
				}
			}
		})
		
		this.moves = targetSquares
	}
}


class Bishop extends Piece {
	constructor(pos) {
		super(pos)
		this.code = 'b'
	}
	
	getMoves() {
		let vectors = [[-1, -1], [-1, 1], [1, 1], [1, -1]]
		let targetSquares = []
		vectors.forEach(vector => {
			let targetSquare = [this.pos[0], this.pos[1]]
			while (true) {
				targetSquare[0] += vector[0]
				targetSquare[1] += vector[1]
				if ((targetSquare[0] >= 0 && targetSquare[0] < 8) && (targetSquare[1] >= 0 && targetSquare[1] < 8)) {
					if (board[targetSquare[1]][targetSquare[0]] === null) {
						targetSquares.push(targetSquare)
					}
					else {
						break
					}
				}
				else {
					break
				}
			}
		})
		
		this.moves = targetSquares
	}
}


class King extends Piece {
	constructor(pos) {
		super(pos)
		this.code = 'k'
		this.colour = 'w'
	}
	
	getMoves() {
		let vectors = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]]
		let targetSquares = []
		vectors.forEach(vector => {
			let targetSquare = [this.pos[0] + vector[0], this.pos[1] + vector[1]]
			if ((targetSquare[0] >= 0 && targetSquare[0] < 8) && (targetSquare[1] >= 0 && targetSquare[1] < 8)) {
				if (board[targetSquare[1]][targetSquare[0]] === null) {
					targetSquares.push(targetSquare)
				}
			}
		})
		
		this.moves = targetSquares
	}
	
	update() {}
}
	

board = [
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, Knight, null, null, null],
	[null, null, null, null, null, null, null, null]
]

for (x = 0; x < 8; x++) {
	for (y = 0; y < 8; y++) {
		if (board[y][x] !== null) {
			let newPiece = new board[y][x]([x, y])
			newPiece.direction = [0, -1]
			board[y][x] = newPiece
		}
	}
}

let king = new King([4, 3])
board[3][4] = king

let illegalSquaresList = []

function draw() {
	piecesLayer.empty()
	
	illegalSquaresList.forEach(square => {
		piecesLayer.append(`<square class="illegal_square" style="transform: translate(${square[0] * squareSize}px, ${square[1] * squareSize}px)"></square>`)
	})
	
	for (x = 0; x < 8; x++) {
		for (y = 0; y < 8; y++) {
			if (board[y][x] !== null) {
				piece = board[y][x]
				piecesLayer.append('<piece class="' +
					((piece.colour == 'b') ? 'd' : 'l') + ' ' + piece.code + `" draggable="false" style="transform: translate(${(x * squareSize) + 'px, ' + (y * squareSize)}px);"></piece`)
			}
		}
	}
}

function main() {
	illegalSquaresList = []
	
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			if (board[y][x] !== null) {
				piece = board[y][x]
				piece.update()
				piece.getMoves()
				if (piece.colour == 'b') {
					illegalSquares = piece.moves
					illegalSquares.forEach(square => illegalSquaresList.push(square))
				}
			}
		}
	}
	
	draw()
}

main()

document.addEventListener('keydown', move)

function move(e) {
	switch(e.code) {
		case 'KeyW':
			board[king.pos[1]][king.pos[0]] = null
			king.pos[1] -= 1
			board[king.pos[1]][king.pos[0]] = king
			break
	}
}

