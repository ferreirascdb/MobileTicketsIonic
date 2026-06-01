const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Últimas 5 senhas chamadas
router.get('/ultimas-chamadas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        t.id,
        t.numero,
        t.tipo,
        t.status,
        t.data_chamada,
        g.nome AS guiche_nome
      FROM tickets t
      LEFT JOIN guiches g ON g.id = t.guiche_id
      WHERE t.data_chamada IS NOT NULL
      ORDER BY t.data_chamada DESC
      LIMIT 5
      `
    );

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: 'Erro ao buscar últimas chamadas.'
    });
  }
});

module.exports = router;
