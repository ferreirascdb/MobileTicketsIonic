const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function expedienteAberto() {
  if (process.env.CHECK_HOURS !== 'true') {
    return true;
  }

  const agora = new Date();
  const hora = agora.getHours();

  return hora >= 7 && hora < 17;
}

function ordemDeChamada(ultimoTipoChamado) {
  if (!ultimoTipoChamado) {
    return ['SP', 'SE', 'SG'];
  }

  if (ultimoTipoChamado === 'SP') {
    return ['SE', 'SG', 'SP'];
  }

  return ['SP', 'SE', 'SG'];
}

// LISTAR GUICHÊS
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM guiches
      WHERE ativo = TRUE
      ORDER BY id
      `
    );

    return res.json(rows);

  } catch (error) {
    console.error('Erro ao listar guichês:', error);

    return res.status(500).json({
      erro: 'Erro ao listar guichês.'
    });
  }
});

// BUSCAR SENHA ATUAL DO GUICHÊ
router.get('/:guicheId/senha-atual', async (req, res) => {
  try {
    const guicheId = Number(req.params.guicheId);

    if (!Number.isInteger(guicheId) || guicheId <= 0) {
      return res.status(400).json({
        erro: 'ID do guichê inválido.'
      });
    }

    const [guicheRows] = await pool.query(
      `
      SELECT id, nome, ativo
      FROM guiches
      WHERE id = ?
      LIMIT 1
      `,
      [guicheId]
    );

    if (guicheRows.length === 0) {
      return res.status(404).json({
        erro: 'Guichê não encontrado.'
      });
    }

    if (!guicheRows[0].ativo) {
      return res.status(400).json({
        erro: 'Guichê inativo.'
      });
    }

    const [senhaAtual] = await pool.query(
      `
      SELECT 
        t.*, 
        g.nome AS guiche_nome
      FROM tickets t
      LEFT JOIN guiches g ON g.id = t.guiche_id
      WHERE t.guiche_id = ?
        AND t.status = 'CHAMADA'
      ORDER BY t.data_chamada DESC
      LIMIT 1
      `,
      [guicheId]
    );

    if (senhaAtual.length === 0) {
      return res.json({
        ticket: null
      });
    }

    return res.json({
      ticket: senhaAtual[0]
    });

  } catch (error) {
    console.error('Erro ao buscar senha atual do guichê:', error);

    return res.status(500).json({
      erro: 'Erro ao buscar senha atual do guichê.'
    });
  }
});

// CHAMAR A PRÓXIMA SENHA
router.post('/:guicheId/chamar-proxima', async (req, res) => {
  try {
    const guicheId = Number(req.params.guicheId);

    if (!Number.isInteger(guicheId) || guicheId <= 0) {
      return res.status(400).json({
        erro: 'ID do guichê inválido.'
      });
    }

    const [guicheRows] = await pool.query(
      `
      SELECT id, nome, ativo
      FROM guiches
      WHERE id = ?
      LIMIT 1
      `,
      [guicheId]
    );

    if (guicheRows.length === 0) {
      return res.status(404).json({
        erro: 'Guichê não encontrado.'
      });
    }

    if (!guicheRows[0].ativo) {
      return res.status(400).json({
        erro: 'Guichê inativo.'
      });
    }

    if (!expedienteAberto()) {
      return res.status(400).json({
        erro: 'Fora do horário de atendimento'
      });
    }

    const [senhaAberta] = await pool.query(
      `
      SELECT 
        t.*, 
        g.nome AS guiche_nome
      FROM tickets t
      LEFT JOIN guiches g ON g.id = t.guiche_id
      WHERE t.guiche_id = ?
        AND t.status = 'CHAMADA'
      ORDER BY t.data_chamada DESC
      LIMIT 1
      `,
      [guicheId]
    );

    if (senhaAberta.length > 0) {
      return res.status(409).json({
        erro: 'Este guichê já possui uma senha chamada. Finalize antes de chamar outra.',
        ticket: senhaAberta[0]
      });
    }

    const [ultimoChamado] = await pool.query(
      `
      SELECT tipo 
      FROM tickets 
      WHERE data_chamada IS NOT NULL
        AND DATE(data_chamada) = CURDATE()
      ORDER BY data_chamada DESC
      LIMIT 1
      `
    );

    const ultimoTipoChamado = ultimoChamado.length > 0 
      ? ultimoChamado[0].tipo 
      : null;

    const ordem = ordemDeChamada(ultimoTipoChamado);

    let proximaSenha = null;

    for (const tipo of ordem) {
      const [ticketChamar] = await pool.query(
        `
        SELECT * 
        FROM tickets 
        WHERE status = 'EMITIDA'
          AND tipo = ?
          AND DATE(data_emissao) = CURDATE()
        ORDER BY data_emissao ASC, id ASC
        LIMIT 1
        `,
        [tipo]
      );

      if (ticketChamar.length > 0) {
        proximaSenha = ticketChamar[0];
        break;
      }
    }

    if (!proximaSenha) {
      return res.status(404).json({
        erro: 'Não há senhas a serem chamadas'
      });
    }

    await pool.query(
      `
      UPDATE tickets 
      SET 
        status = 'CHAMADA', 
        guiche_id = ?, 
        data_chamada = NOW() 
      WHERE id = ?
      `,
      [guicheId, proximaSenha.id]
    );

    const [senhaAtualizada] = await pool.query(
      `
      SELECT 
        t.*, 
        g.nome AS guiche_nome 
      FROM tickets t
      LEFT JOIN guiches g ON g.id = t.guiche_id
      WHERE t.id = ?
      LIMIT 1
      `,
      [proximaSenha.id]
    );

    return res.json({
      ticket: senhaAtualizada[0]
    });

  } catch (error) {
    console.error('Erro ao chamar a senha:', error);

    return res.status(500).json({
      erro: 'Erro ao chamar a senha'
    });
  }
});

module.exports = router;
