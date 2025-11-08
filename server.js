require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_PATH = path.join(__dirname, 'data', 'productos.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API routes
app.get('/api/productos', (req, res) => {
    fs.readFile(PRODUCTS_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading products file' });
        }
        res.json({ productos: JSON.parse(data) });
    });
});

app.post('/api/productos', (req, res) => {
    const { productos: newProducts } = req.body;
    fs.writeFile(PRODUCTS_PATH, JSON.stringify(newProducts, null, 2), 'utf8', err => {
        if (err) {
            return res.status(500).json({ message: 'Error writing products file' });
        }
        res.json({ message: 'Products updated successfully' });
    });
});

// Admin login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD; // No hardcoded fallback

    if (password === adminPassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
