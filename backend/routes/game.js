import express from 'express';
import { v4 as uuidv4 } from 'uuid';

import * as jwt from '../utils/jwt.js';

export const game = express.Router();

function isUUID(s) {
    return s.match("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
}

game.post('/', async (req, res) => {
    try {
        const gameId = uuidv4();
        const client = await req.app.settings.pool.connect();

        try {
            await client.query('BEGIN');
            await client.query('INSERT INTO games (id, creator) VALUES ($1, $2)', [gameId, res.locals.user.username]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        } finally {
            client.release();
        }
        res.status(201).json({
            success: true,
            game_id: gameId,
            creator_token: await jwt.sign({ game_id: gameId, creator: res.locals.user.username }),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

game.get('/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;

        if (!isUUID(gameId))
            return res.status(400).json({ success: false, message: 'Invalid game ID' });
        const result = await req.app.settings.pool.query(
            'SELECT * FROM games WHERE id = $1 AND NOT creator = $2 AND player IS NULL',
            [gameId, res.locals.user.username],
        );

        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Game not found' });
        res.status(200).json({
            success: true,
            player_token: await jwt.sign({ game_id: gameId, player: res.locals.user.username }),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
