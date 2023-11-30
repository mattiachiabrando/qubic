import express from 'express';
import parser from 'body-parser';
import pg from 'pg';
import pgSession from 'connect-pg-simple';
import session from 'express-session';
import { WebSocketServer } from 'ws';

import { user } from './routes/user.js';
import { username } from './middlewares/username.js';
import { index } from './routes/index.js';
import { game } from './routes/game.js';
import * as connect from './handlers/connect.js';
import { AsyncWebSocket } from './utils/ws.js';

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
const wss = new WebSocketServer({ noServer: true, path: '/game' });

app.set('pool', pool);
app.set('clients', clients);
app.set('wss', wss);
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

app.use(parser.json());
app.use('/static', express.static('static/'));

const sessionParser = session({
    store: new (pgSession(session))({ pool }),
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
});
app.use(sessionParser);

app.use('/user', user);

app.use(username);

app.use('/', index)
app.use('/game', game)

const server = app.listen(port, () => console.log(`Server is listening at http://localhost:${port}`));

server.on('upgrade', (req, socket, head) => {
    req.locals = { pool, clients };
    sessionParser(
        req,
        {},
        () => username(
            req,
            {},
            () => wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req))
        )
    );
});
wss.on('connection', (ws, req) => connect.general(new AsyncWebSocket(ws), req));
