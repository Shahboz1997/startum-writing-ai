import express from 'express';
import * as bank from '../../src/lib/bankCore.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const list = bank.filterTemplates(req.query);
    res.json({ data: list, count: list.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req, res) => {
  try {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      headers[String(k).toLowerCase()] = v;
    }
    const result = bank.addTemplate(req.body, headers);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json({ data: result.template });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    if (!/^\d+$/.test(String(req.params.id))) {
      return res.status(400).json({ error: 'Invalid template id' });
    }
    const row = bank.getTemplateById(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ data: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
