function _checkFace(face) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const combination of winningCombinations) {
        const sum = face[combination[0]] + face[combination[1]] + face[combination[2]];

        if (sum === 3 || sum === -3)
            return sum / 3;
    }
    return 0;
}

export function checkBoard(board) {
    const boardCombinations = [
        [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 0], [0, 1, 1], [0, 1, 2], [0, 2, 0], [0, 2, 1], [0, 2, 2]], // row 1
        [[1, 0, 0], [1, 0, 1], [1, 0, 2], [1, 1, 0], [1, 1, 1], [1, 1, 2], [1, 2, 0], [1, 2, 1], [1, 2, 2]], // row 2
        [[2, 0, 0], [2, 0, 1], [2, 0, 2], [2, 1, 0], [2, 1, 1], [2, 1, 2], [2, 2, 0], [2, 2, 1], [2, 2, 2]], // row 3
        [[0, 0, 0], [0, 1, 0], [0, 2, 0], [1, 0, 0], [1, 1, 0], [1, 2, 0], [2, 0, 0], [2, 1, 0], [2, 2, 0]], // column 1
        [[0, 0, 1], [0, 1, 1], [0, 2, 1], [1, 0, 1], [1, 1, 1], [1, 2, 1], [2, 0, 1], [2, 1, 1], [2, 2, 1]], // column 2
        [[0, 0, 2], [0, 1, 2], [0, 2, 2], [1, 0, 2], [1, 1, 2], [1, 2, 2], [2, 0, 2], [2, 1, 2], [2, 2, 2]], // column 3
        [[0, 0, 0], [0, 1, 1], [0, 2, 2], [1, 0, 0], [1, 1, 1], [1, 2, 2], [2, 0, 0], [2, 1, 1], [2, 2, 2]], // diagonal 1
        [[0, 0, 2], [0, 1, 1], [0, 2, 0], [1, 0, 2], [1, 1, 1], [1, 2, 0], [2, 0, 2], [2, 1, 1], [2, 2, 0]], // diagonal 2
    ];

    for (const combination of boardCombinations) {
        const face = combination.map(e => board[e[0]][e[1]][e[2]]);
        const result = _checkFace(face);

        if (result !== 0)
            return result;
    }
    return (board.flat(2).some(e => e === 0) ? 0 : 2);
}
