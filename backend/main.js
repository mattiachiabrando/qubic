import express from 'express';
import parser from 'body-parser';
import pg from 'pg';
import { WebSocketServer } from 'ws';

import * as connect from './handlers/connect.js';
import WebSocketClient from './utils/ws.js';
import { authenticate } from './middlewares/authenticate.js';
import { cookie } from './middlewares/cookie.js';
import { index } from './routes/index.js';
import { game } from './routes/game.js';
import { user } from './routes/user.js';

const app = express();
const port = 8080;

const pool = new pg.Pool({
    user: process.env.POSTGRES_USER,
    host: 'postgres',
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});
const clients = new Map();
const wss = new WebSocketServer({ noServer: true });

app.set('pool', pool);
app.set('clients', clients);
app.set('wss', wss);
app.set('view engine', 'ejs')

app.use(parser.json());
app.use(cookie);

app.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
    });
});
wss.on('connection', (ws, req) => connect.general(WebSocketClient(ws), req));

app.use('/user', user);

app.use(authenticate);

app.use('/', index)
app.use('/game', game);

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
