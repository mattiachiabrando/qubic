export async function username(req, res, next) {
    if (typeof req.session.username !== 'string' || !req.session.username)
        return res.redirect('/user/login');
    const client = await (typeof req.app !== 'undefined' ? req.app.settings : req.locals).pool.connect();

    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [req.session.username]);

        if (result.rows.length === 0)
            return res.redirect('/user/login');
        if (typeof req.locals === 'undefined')
            req.locals = {};
        req.locals.user = result.rows[0];
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        client.release();
    }
}
