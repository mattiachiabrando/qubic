import * as jwt from '../utils/jwt.js';

export async function authenticate(req, res, next) {
    const token = res.locals.cookie.token;

    if (typeof token !== 'string' || !token)
        return res.redirect('/user/login');

    try {
        var decoded = await jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        res.redirect('/user/login');
    }
    const client = await req.app.settings.pool.connect();

    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [decoded.username]);

        if (result.rows.length === 0)
            return res.redirect('/user/login');
        res.locals.token = token;
        res.locals.user = result.rows[0];
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        client.release();
    }
}
