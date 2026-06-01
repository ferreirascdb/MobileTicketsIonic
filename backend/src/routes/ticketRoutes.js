const express = require('express');
const dayjs = require('dayjs')
const pool = require('../config/database');

const router = express.Router();

function expedienteAberto(){
    //para testar fora do horário valido 
    if (process.env.CHEK_HOURS !== 'true'){
        return true
    }

    const agora = new Date();
    const hora = agora.getHours();
    return hora >= 7 && hora <17;

}

//formata a senha no padrão exigido 
function formatarNumeroSenha(tipo, sequencia){
    const data = dayjs().format('YYMMDD');
    const seq = String(sequencia).padStart(2, '0');
    return `${data}-${tipo}${seq}`;
}

//CRIAR SENHAS
router.post('/', async(req, res) => {
    try {
        const {tipo} = req.body;
        if (!expedienteAberto()){
            return res.status(400).json({
                erro: 'Fora do horário de expediente'
            });
        }
        const [countRows] = await pool.query(
            `SELECT COUNT (*) AS total
            FROM tickets
            WHERE tipo = ?
            and DATE(data_emissao) = CURDATE()`, [tipo]);
        const sequencia = countRows[0].total + 1;
        const numero = formatarNumeroSenha(tipo, sequencia);
        const [result] = await pool.query(
            `INSERT INTO tickets (numero, tipo, sequencia) VALUES (?,?,?)`, [numero, tipo, sequencia]
        );
        const [ticketRows] = await pool.query(
            `SELECT * FROM tickets WHERE id = ?`, [result.insertId]
        );
        res.status(201).json(ticketRows[0]);
    } catch (error){
        console.log(error);
        res.status(500).json({
            erro: 'Erro ao criar senha.'
        });
    }

});
//Listar toas as senhas
router.get('/', async (req,res)=> {
    try {
        const [total] = await pool.query(
            `
            SELECT t.*, g.nome as guiche_nome from tickets t
            LEFT JOIN guiches g ON g.id = t.guiche_id
            ORDER BY t.id DESC
            `
        );
    } catch (error){
        res.status(500);
    }
});

//FINALIZAR ATENDIMENTO
router.patch('/:id/finalizar', async (req, res)=>{
    try{
        const {id} = req.params;
        const [ticketsRetorno] = await pool.query(
            `
            SELECT * FROM tickets where id = ?           
            `,[id]
        );
        const ticket = ticketsRetorno[0];
        if (ticket.status !== 'CHAMADA'){
            return res.status(400).json({erro:'senha ainda n chamada'});
        }
        await pool.query(
            `
            UPDATE tickets
            SET 
                status = 'ATENDIDA',
                data_fim_atendimento = NOW(),
                tempo_atendimento_segundos = TIMESTAMPDIFF(SECOND, data_chamada, NOW())
            WHERE id = ?
            `,
            [id]
        );
        const [linhasAtualizadas] = await pool.query(
            `
            SELECT * FROM tickets where id = ?
            `, [id]
        );
        res.json(linhasAtualizadas[0]);
    } catch (error){
        console.log(error);
        res.status(500).json({
            erro: 'Erro ao finalizar'
        });
    }
});
module.exports = router;