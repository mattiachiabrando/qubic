import { Router } from 'express';

export const game = Router();

game.get('/:id', (req, res) => res.render('index', { user: req.locals.user, gameId: req.params.id }));
