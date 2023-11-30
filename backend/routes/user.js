import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { username } from '../middlewares/username.js';

export const user = Router();

user.get('/', username, (req, res) => res.status(200).json({ success: true, user: req.locals.user }));

user.get('/register', async (req, res) => res.render('register'));

user.post('/register', async (req, res) => {
    try {
        const { username, password, confirm_password } = req.body;

        if (typeof username !== 'string' || !username)
            return res.status(400).json({ success: false, message: 'Invalid username' });
        else if (typeof password !== 'string' || !password)
            return res.status(400).json({ success: false, message: 'Invalid password' });
        else if (typeof confirm_password !== 'string' || !confirm_password || confirm_password !== password)
            return res.status(400).json({ success: false, message: 'Invalid cofirm password' });
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
        const client = await req.app.settings.pool.connect();

        try {
            await client.query('BEGIN');
            var result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            if (result.rows.length !== 0)
                return res.status(401).json({ success: false, message: 'Username already occupied' });
            await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
            await client.query('COMMIT');
            return res.status(201).json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

user.get('/login', async (req, res) => res.render('login'));

user.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== 'string' || !username)
            return res.status(400).json({ success: false, message: 'Invalid username' });
        else if (typeof password !== 'string' || !password)
            return res.status(400).json({ success: false, message: 'Invalid password' });
        const client = await req.app.settings.pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            if (result.rows.length === 0)
                return res.status(401).json({ success: false, message: 'Invalid username' });
            const user = result.rows[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch)
                return res.status(401).json({ success: false, message: 'Invalid password' });
            await client.query('COMMIT');
            req.session.username = user.username;
            return res.status(200).json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
