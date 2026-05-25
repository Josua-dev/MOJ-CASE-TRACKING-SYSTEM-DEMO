const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', system: 'MOJ Case Tracking System', version: '1.0.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`MOJ Backend running on http://localhost:${PORT}`));
