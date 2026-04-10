import express from 'express';
import * as bank from '../../src/lib/bankCore.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const list = bank.filterTopics(req.query);
    res.json({ data: list, count: list.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
