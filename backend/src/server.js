const express =require('express');
const cors = require('cors');
require('dotenv').config();


const ticketRoutes = require('./routes/ticketRoutes');
const guicheRoutes = require('./routes/guicheRoutes');
const painelRoutes = require('./routes/painelRoutes');

const app =express();
app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use('/api/guiches', guicheRoutes);
app.use('/api/painel', painelRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'API funcionando'
  });
});

const PORT = 3000;

app.listen(PORT,  () => {
    console.log(`Servidor rodando na porta ${PORT}`)
});