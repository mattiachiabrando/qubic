import * as jwt from '../utils/jwt.js';

import { play } from './play.js';

export async function general(ws, req) {
    const event = await ws.receive();

    if (event.type !== 'text' || (event.data !== 'creator' && event.data !== 'player'))
        return ws.close(400, 'Invalid data');
    else if (event.data === 'creator')
        creator(ws, req)
    else
        player(ws, req)
}

export async function creator(ws, req) {
    // creator authentication
    var event = await ws.receive();

    try {
        var decoded = await jwt.verify(event.data, process.env.JWT_SECRET);
    } catch (error) {
        return ws.close(403, 'Invalid token');
    }
    const client = await req.app.settings.pool.connect();

    try {
        const result = await client.query('SELECT * FROM games WHERE id = $1 AND creator = $2', [decoded.game_id, decoded.creator]);

        if (result.rows.length === 0)
            return ws.close(403, 'Game not found');
    } catch (error) {
        console.error(error);
        ws.close(500, 'Internal Server Error');
    } finally {
        client.release();
    }
    req.app.settings.clients.set(decoded.creator, ws);

    // player authentication
    event = await ws.receive();

    try {
        decoded = await jwt.verify(event.data, process.env.JWT_SECRET);
    } catch (error) {
        return ws.close(403, 'Invalid token');
    }

    try {
        const result = await client.query(
            'SELECT * FROM games WHERE id = $1 AND creator = $2 AND player = $3',
            [decoded.game_id, decoded.creator, decoded.player],
        );

        if (result.rows.length === 0)
            return ws.close(403, 'Game not found');
    } catch (error) {
        console.error(error);
        ws.close(500, 'Internal Server Error');
    } finally {
        client.release();
    }

    // game initialization
    play(req.app.settings.clients.get(creator), req.app.settings.clients.get(player));
}

export async function player(creatorWs, req) {
    // player authentication
    var event = await ws.receive();

    try {
        var decoded = await jwt.verify(event.data, process.env.JWT_SECRET);
    } catch (error) {
        return ws.close(403, 'Invalid token');
    }
    const client = await req.app.settings.pool.connect();

    try {
        const result = await client.query(
            'SELECT * FROM games WHERE id = $1 AND NOT creator = $2 AND player IS NULL',
            [decoded.game_id, decoded.player],
        );

        if (result.rows.length === 0)
            return ws.close(403, 'Game not found');
        var creator = result.rows[0].creator;
    } catch (error) {
        console.error(error);
        ws.close(500, 'Internal Server Error');
    } finally {
        client.release();
    }
    req.app.settings.clients.set(decoded.player, ws);
    req.app.settings.clients.get(creator).send(JSON.stringify({ game_id: decoded.game_id, creator, player: decoded.player }));
}

