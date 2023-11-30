import * as jwt from '../utils/jwt.js';
import { play } from './play.js';

export async function general(ws, req) {
    const event = await ws.receive();

    if (event !== 'CREATOR' && event !== 'PLAYER') {
        ws.send('ERROR Invalid data');
        return await ws.close(1000);
    }
    ws.send('OK');

    if (event === 'CREATOR')
        creatorHandler(ws, req);
    else
        playerHandler(ws, req);
}

export async function creatorHandler(creatorWs, req) {
    const gameId = [...Array(8)].map(() => Math.floor(Math.random() * 36).toString(36)).join('');
    const client = await req.locals.pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO games (id, creator) VALUES ($1, $2)', [gameId, req.locals.user.username]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        creatorWs.send('ERROR Internal server error');
        return await creatorWs.close();
    }
    creatorWs.send(gameId);
    req.locals.clients.set(req.locals.user.username, creatorWs);
    const playerJWT = await creatorWs.receive();

    try {
        var decoded = await jwt.verify(playerJWT, process.env.JWT_SECRET);
    } catch (error) {
        creatorWs.send('ERROR Invalid token');
        return await creatorWs.close();
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [decoded.username]);

        if (result.rows.length === 0) {
            ws.send('ERROR User not found');
            return await creatorWs.close();
        }
        var player = result.rows[0];
    } catch (error) {
        console.error(error);
        creatorWs.send('ERROR Internal Server Error');
        return await creatorWs.close();
    }

    try {
        await client.query('BEGIN');
        await client.query('UPDATE games SET player = $1 WHERE id = $2', [player.username, gameId]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        creatorWs.send('ERROR Internal Server Error');
        return await creatorWs.close();
    } finally {
        client.release();
    }
    creatorWs.send('OK');
    play(creatorWs, req.locals.clients.get(player.username), req.locals.pool, gameId);
}

export async function playerHandler(playerWs, req) {
    const gameId = await playerWs.receive();

    if (!gameId.match('^[a-z0-9]{8}$')) {
        playerWs.send('ERROR Invalid game ID');
        return await playerWs.close();
    }
    const client = await req.locals.pool.connect();

    try {
        const result = await client.query(
            'SELECT * FROM games WHERE id = $1 AND NOT creator = $2 AND player IS NULL',
            [gameId, req.locals.user.username],
        );

        if (result.rows.length === 0) {
            playerWs.send('ERROR Game not found');
            return await playerWs.close();
        }
        var game = result.rows[0];
    } catch (error) {
        console.error(error);
        playerWs.send('ERROR Internal Server Error');
        return await playerWs.close();
    } finally {
        client.release();
    }
    playerWs.send('OK');
    req.locals.clients.set(req.locals.user.username, playerWs);
    req.locals.clients.get(game.creator).send(await jwt.sign({ username: req.locals.user.username }, process.env.JWT_SECRET));
}
