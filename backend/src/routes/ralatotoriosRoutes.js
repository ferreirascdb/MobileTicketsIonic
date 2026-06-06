const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const dayjs = require('dayjs');

//diario
router.get('/diario', async (req, res) =>{
    try {
        const {data} = res.query;
        const dataInicio = datajs(data).format('YYYY-MM-DD 00:00:00');
        const dataFim = dayjs(data).add(1, 'day').format('YYYY-MM-DD 00:00:00');
        
        const relatorio = await gerarRelatorio(dataInicio, dataFim);
    } catch(error){
        res.status(500).json({erro: 'erro ao gerar relatio diario'})
    }
});
// Relatório mensal
router.get('/mensal', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano || !mes) {
            return res.status(400).json({
                erro: 'Informe ano e mes. Exemplo: ?ano=2025&mes=06'
            });
        }

        const dataBase = `${ano}-${mes}-01`;

        const dataInicio = dayjs(dataBase).startOf('month').format('YYYY-MM-DD 00:00:00');
        const dataFim = dayjs(dataBase).add(1, 'month').startOf('month').format('YYYY-MM-DD 00:00:00');

        const relatorio = await gerarRelatorio(dataInicio, dataFim);

        res.json({
            tipoRelatorio: 'MENSAL',
            periodo: {
                inicio: dataInicio,
                fim: dataFim
            },
            ...relatorio
        });

    } catch (error) {
        console.log(error);
    }
});

//relaátorio
async function gerarRelatorio(dataInicio, dataFim){

    const [emitidasGeral] = await pool.query(
        `
            SELECT COUNT (*) AS TOTAL FROM tickets WHERE data_emissao >= ? and data_emissao < ?
        `, [dataInicio, dataFim]
    );
    
    //senhas atendidas
    const [atendidas] = await pool.query(
        `select count(*) as total from tickets where status = 'ATENDIDA' and data_fim_atendimento >= ? 
        and data_fim_atendimento < ?`, [dataInicio, dataFim]
    );
    // emitidas por tipo
    const [emitidasTipo] = await pool.query(`select tipo, count (*) as total from tickets
        where data_emissao >= ? and data_emissao < ? GROUP BY tipo
        ORDER BY tipo`, [dataInicio, dataFim]);
    //atendidas  por tipo
    const [atendidasTipo] = await pool.query(`select tipo, count(*) as total from tickets where status = 'ATENDIDA' 
        AND data_fim_atendimento >= ?
        AND data_fim_atendimento < ?  GROUP BY tipo`, [dataInicio, dataFim]);
    //detalhado
    const [detalhado] = await pool.query(
       `
        SELECT
            t.numero,
            t.tipo,
            t.status,
            t.data_emissao,
            CASE 
                WHEN t.status = 'ATENDIDA' THEN t.data_fim_atendimento
                ELSE NULL
            END AS data_atendimento,
            CASE 
                WHEN t.status = 'ATENDIDA' THEN g.nome
                ELSE NULL
            END AS guiche_responsavel,
            CASE 
                WHEN t.status = 'ATENDIDA' THEN t.tempo_atendimento_segundos
                ELSE NULL
            END AS tempo_atendimento_segundos
        FROM tickets t
        LEFT JOIN guiches g ON g.id = t.guiche_id
        WHERE t.data_emissao >= ?
          AND t.data_emissao < ?
        ORDER BY t.data_emissao ASC
        `,
        [dataInicio, dataFim]
    );
    //tempo medio 
    const [tempoMedio] = await pool.query(`select AVG(tempo_atendimento_segundos) as tempo_medio
        from tickets where status = 'ATENDIDA' AND data_fim_atendimento >= ? and data_fim_atendimento < ?  `, [dataInicio, dataFim]);
     // 7. Tempo médio por tipo de senha
    const [tempoMedioPorTipo] = await pool.query(
        `
        SELECT 
            tipo,
            AVG(tempo_atendimento_segundos) AS tempo_medio_segundos
        FROM tickets
        WHERE status = 'ATENDIDA'
          AND data_fim_atendimento >= ?
          AND data_fim_atendimento < ?
          AND tempo_atendimento_segundos IS NOT NULL
        GROUP BY tipo
        ORDER BY tipo
        `,
        [dataInicio, dataFim]
    );

    return {
        resumo: {
            totalSenhasEmitidas: emitidasGeral[0].total,
            totalSenhasAtendidas: atendidasGeral[0].total
        },
        emitidasPorTipo,
        atendidasPorTipo,
        detalhado,
        tempoMedio: {
            geralSegundos: tempoMedioGeral[0].tempo_medio_segundos,
            geralFormatado: formatarTempoMedio(tempoMedioGeral[0].tempo_medio_segundos),
            porTipo: tempoMedioPorTipo.map(item => ({
                tipo: item.tipo,
                tempo_medio_segundos: item.tempo_medio_segundos,
                tempo_medio_formatado: formatarTempoMedio(item.tempo_medio_segundos)
            }))
        }
    };
}


module.exports = router;