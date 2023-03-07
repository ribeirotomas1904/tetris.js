"use strict";

const pipe = (data, ...fns) => fns.reduce((acc, fn) => fn(acc), data);

const log = (x) => {
    console.log(x);
    return x;
};

const getRandomElement = arrayLike => arrayLike[Math.floor(Math.random() * arrayLike.length)];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const INITIAL_PIECE_POSITION = {
    row: 0,
    col: 3,
};

const initialBoard =
    Array(BOARD_HEIGHT).fill(Array(BOARD_WIDTH).fill(null));

const PIECES = {
    I: {
        color: "#00ffff",
        cells: [
            [null, null, null, null],
            ["  ", "  ", "  ", "  "],
            [null, null, null, null],
            [null, null, null, null],
        ],
    },
    O: {
        color: "#ffff00",
        cells: [
            ["  ", "  "],
            ["  ", "  "],
        ],
    },
    T: {
        color: "#ff00fe",
        cells: [
            [null, null, null],
            ["  ", "  ", "  "],
            [null, "  ", null],
        ],
    },
    J: {
        color: "#0000fe",
        cells: [
            [null, "  ", null],
            [null, "  ", null],
            ["  ", "  ", null],
        ],
    },
    L: {
        color: "#ff7f00",
        cells: [
            [null, "  ", null],
            [null, "  ", null],
            [null, "  ", "  "],
        ],
    },
    S: {
        color: "#23fe40",
        cells: [
            [null, null, null],
            [null, "  ", "  "],
            ["  ", "  ", null],
        ],
    },
    Z: {
        color: "#fe161d",
        cells: [
            [null, null, null],
            ["  ", "  ", null],
            [null, "  ", "  "],
        ],
    },
};

const MOVES = {
    DOWN: Symbol(),
    LEFT: Symbol(),
    RIGHT: Symbol(),
    ROTATE_LEFT: Symbol(),
    ROTATE_RIGHT: Symbol(),
    DROP: Symbol(),
};

const getRandomPiece = () => PIECES[getRandomElement(Object.keys(PIECES))];

const initialGameState = {
    board: initialBoard,
    piece: getRandomPiece(),
    piecePosition: INITIAL_PIECE_POSITION,
    isDone: false,
};

const rotatePieceRight = piece => ({
    ...piece, cells: piece.cells.map((row, rowIndex) => row.map((_, colIndex) => piece.cells[row.length - 1 - colIndex][rowIndex]))
});

const rotatePieceLeft = piece => ({
    ...piece, cells: piece.cells.map((row, rowIndex) => row.map((_, colIndex) => piece.cells[colIndex][row.length - 1 - rowIndex]))
});

const movePiece = (state, move) => {
    const { piece, piecePosition } = state;

    switch (move) {
        case MOVES.ROTATE_LEFT:
            return {
                ...state,
                piece: rotatePieceLeft(piece),
            };

        case MOVES.ROTATE_RIGHT:
            return {
                ...state,
                piece: rotatePieceRight(piece),
            };

        case MOVES.LEFT:
            return {
                ...state,
                piecePosition: {
                    row: piecePosition.row,
                    col: piecePosition.col - 1,
                },
            };

        case MOVES.RIGHT:
            return {
                ...state,
                piecePosition: {
                    row: piecePosition.row,
                    col: piecePosition.col + 1,
                },
            };

        case MOVES.DOWN:
            return {
                ...state,
                piecePosition: {
                    row: piecePosition.row + 1,
                    col: piecePosition.col,
                },
            };
    }
};

const hasCollision = state =>
    state.piece.cells.some((row, rowIndex) =>
        row.some((pieceCell, colIndex) => {
            const boardCell = state.board[state.piecePosition.row + rowIndex]?.[state.piecePosition.col + colIndex];

            const isPieceCellFull = pieceCell !== null;
            const isBoardCellFullOrOut = boardCell !== null;

            return isPieceCellFull && isBoardCellFullOrOut;
        }));


const fixPieceToBoard = state => {
    const { piecePosition, board, piece } = state;

    // FIXME: why doesn't the structuredClone works here?
    const newBoard = board.map(row => row.map(cell => cell));

    piece.cells.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
        if (cell !== null) {
            newBoard[piecePosition.row + rowIndex][piecePosition.col + colIndex] = piece.color;
        }
    }));

    return {
        ...state,
        board: newBoard,
    };
};

const clearFullrows = state => {
    const nonFullRows = state.board.filter(row => row.some(cell => cell === null));
    const emptyRows = Array(BOARD_HEIGHT - nonFullRows.length).fill(Array(BOARD_WIDTH).fill(null));

    const newBoard = [...emptyRows, ...nonFullRows];

    return {
        ...state,
        board: newBoard,
    };
};

const spawnNewPiece = state => {
    return {
        ...state,
        piecePosition: INITIAL_PIECE_POSITION,
        piece: getRandomPiece(),
    };
};

const getNextGameState = (state, move) => {
    const nextState = movePiece(state, move);

    const hadCollision = hasCollision(nextState);

    if (hadCollision && move === MOVES.DOWN) {
        const newState =
            pipe(
                state,
                fixPieceToBoard,
                clearFullrows,
                spawnNewPiece,
            );

        return {
            ...newState,
            isDone: hasCollision(newState),
        };

    }

    if (hadCollision) {
        return state;
    }

    return nextState;
};

const BOARD_CELL_SIZE = 45;
const BOARD_LINES_WIDTH = 1;

const canvas = document.querySelector("canvas");

const canvasWidth = BOARD_WIDTH * BOARD_CELL_SIZE + (BOARD_WIDTH + 1) * BOARD_LINES_WIDTH;
const canvasHeight = BOARD_HEIGHT * BOARD_CELL_SIZE + (BOARD_HEIGHT + 1) * BOARD_LINES_WIDTH;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

const ctx = canvas.getContext("2d");

const render = state => {
    const { board } = fixPieceToBoard(state);

    board.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
        ctx.fillStyle = (cell === null) ? "white" : cell;

        const x = colIndex * BOARD_CELL_SIZE + (colIndex + 1) * BOARD_LINES_WIDTH;
        const y = rowIndex * BOARD_CELL_SIZE + (rowIndex + 1) * BOARD_LINES_WIDTH;

        ctx.fillRect(x, y, BOARD_CELL_SIZE, BOARD_CELL_SIZE);
    }));

    ctx.fillStyle = "black";

    for (let colIndex = 0; colIndex <= BOARD_WIDTH; colIndex++) {
        const x = colIndex * BOARD_CELL_SIZE + colIndex * BOARD_LINES_WIDTH;
        ctx.fillRect(x, 0, BOARD_LINES_WIDTH, canvasHeight);
    }

    for (let rowIndex = 0; rowIndex <= BOARD_HEIGHT; rowIndex++) {
        const y = rowIndex * BOARD_CELL_SIZE + rowIndex * BOARD_LINES_WIDTH;
        ctx.fillRect(0, y, canvasWidth, BOARD_LINES_WIDTH);
    }
};

const keyboardEventKeyToMove = eventKey =>
    ({
        ArrowRight: MOVES.RIGHT,
        ArrowLeft: MOVES.LEFT,
        ArrowDown: MOVES.DOWN,
        ArrowUp: MOVES.ROTATE_RIGHT,
    })[eventKey];

let currentGameState = initialGameState;

render(initialGameState);

document.addEventListener("keydown", (event) => {
    const move = keyboardEventKeyToMove(event.key);

    if (move && !currentGameState.isDone) {
        currentGameState = getNextGameState(currentGameState, move);
        render(currentGameState);
    }
});

const intervalId = setInterval(() => {
    currentGameState = getNextGameState(currentGameState, MOVES.DOWN);
    render(currentGameState);

    if (currentGameState.isDone) {
        clearInterval(intervalId);
    }
}, 900);
