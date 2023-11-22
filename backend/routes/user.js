import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const user = Router();

user.get('/', (req, res) => res.status(200).json({ success: true, user: res.locals.user }));

user.get('/register', async (req, res) => res.render("register"));

user.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== 'string' || !username)
            return res.status(400).json({ success: false, message: 'Invalid username' });
        else if (typeof password !== 'string' || !password)
            return res.status(400).json({ success: false, message: 'Invalid password' });
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
        const client = await req.app.settings.pool.connect();

        try {
            await client.query('BEGIN');
            var result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            if (result.rows.length !== 0)
                return res.status(401).json({ success: false, message: 'Username already occupied' });
            result = await client.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);
            await client.query('COMMIT');
            res.status(201).json({ success: true, message: 'User registered successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

user.get('/login', async (req, res) => res.render("login"));

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
            res.cookie('token', jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '12h' }));
            res.status(200).json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

user.get('/token', (req, res) => {
    const { token } = req;

    if (typeof token !== 'string' || !token)
        return res.status(401).json({ success: false, message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err)
            return res.status(403).json({ success: false, message: 'Invalid token' });
        const newToken = jwt.sign({ username: decoded.username }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.status(200).json({ success: true, token: newToken });
    });
});
