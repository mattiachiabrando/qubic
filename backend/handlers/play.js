import { checkBoard } from '../utils/board.js';

export async function play(creatorWs, playerWs) {
    var board = Array(3).fill(Array(3).fill(Array(3).fill(0)));
    var creatorTurn = Math.round(Math.random()) == 1;

    while (true) {
        // TODO: add timeout
        var event = await (creatorTurn ? creatorWs : playerWs).receive();

        if (event.data === 'leave') {
            // TODO: better game leave handling
            (creatorTurn ? creatorWs : playerWs).close(1000, 'You left');
            (creatorTurn ? playerWs : creatorWs).close(1000, `${creatorTurn ? 'Creator' : 'Player'} left`);
        }
        const position = event.data.split(' ');

        if (position.length !== 3 || position.some(e => isNaN(e) || e > 2 || e < 0) || board[position[0]][position[1]][position[2]] !== 0)
            return (creatorTurn ? playerWs : creatorWs).close(400, 'Invalid position');
        board[position[0]][position[1]][position[2]] = creatorTurn ? -1 : 1;
        const result = checkBoard(board);

        if (result === 2) {
            creatorWs.send('draw');
            playerWs.send('draw');
            break;
        } else if (result !== 0) {
            creatorWs.send(result === 1 ? 'win' : 'lose');
            playerWs.send(result === 1 ? 'lose' : 'win');
            break;
        }
        creatorTurn = !creatorTurn;
    }
    creatorWs.close(1000, 'Game finished');
    playerWs.close(1000, 'Game finished');
}
