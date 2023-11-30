import { checkBoard } from '../utils/board.js';

export async function play(creatorWs, playerWs, pool, gameId) {
    var board = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 0)));
    var creatorTurn = Math.round(Math.random()) === 1;

    creatorWs.send(creatorTurn ? 'START' : 'WAIT');
    playerWs.send(creatorTurn ? 'WAIT' : 'START');

    while (true) {
        // TODO: add timeout
        var data = await (creatorTurn ? creatorWs : playerWs).receive();

        if (data === 'LEFT') {
            if (creatorTurn) {
                creatorWs.send('OK');
                await creatorWs.close();
                playerWs.send('LEFT');
                await playerWs.close();
            } else {
                playerWs.send('OK');
                await playerWs.close();
                creatorWs.send('LEFT');
                await creatorWs.close();
            }
            break;
        }
        const position = data.split(',');

        if (position.length !== 3 || position.some(e => isNaN(e) || e > 3 || e < 0) || board[position[0]][position[1]][position[2]] !== 0) {
            if (creatorTurn) {
                creatorWs.send('ERROR Invalid position');
                await creatorWs.close();
            } else {
                playerWs.send('ERROR Invalid position');
                await playerWs.close();
            }
            break;
        }
        (creatorTurn ? creatorWs : playerWs).send('OK');
        board[position[0]][position[1]][position[2]] = creatorTurn ? -1 : 1;
        const result = checkBoard(board);

        if (result === 2) {
            creatorWs.send(`DRAW ${data}`);
            playerWs.send(`DRAW ${data}`);
            break;
        } else if (result !== 0) {
            creatorWs.send(result === 1 ? `LOSE ${data}` : `WIN`);
            playerWs.send(result === 1 ? `WIN` : `LOSE ${data}`);
            break;
        }
        (creatorTurn ? playerWs : creatorWs).send(data);
        creatorTurn = !creatorTurn;
    }
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM games WHERE id = $1', [gameId]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
    }
}
