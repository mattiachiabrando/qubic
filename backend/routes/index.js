import { Router } from 'express';

export const index = Router();

index.get('/', (req, res) => res.render('index', { user: req.locals.user }));
