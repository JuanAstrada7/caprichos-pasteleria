require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_PATH = path.join(__dirname, 'data', 'productos.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let productsCache = [];
try {
    const data = fs.readFileSync(PRODUCTS_PATH, 'utf8');
    productsCache = JSON.parse(data);
} catch (error) {
    console.error("Error al cargar productos.json, iniciando con un array vacío.", error);
    productsCache = [];
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).send();
});

app.get('/api/productos', (req, res) => {
    res.json({ productos: productsCache });
});

app.post('/api/producto', upload.single('imagen'), (req, res) => {
    const { id, nombre, precio, categoria, imagenAnterior } = req.body;
    const isEditing = id !== 'null' && id !== '';
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : imagenAnterior;

    if (isEditing) {
        const productId = Number(id);
        productsCache = productsCache.map(p => p.id === productId ? { ...p, nombre, precio: Number(precio), categoria, imagen: imageUrl } : p);
    } else {
        const newProductData = {
            id: Date.now(),
            nombre,
            precio: Number(precio),
            categoria,
            imagen: imageUrl
        };
        productsCache.push(newProductData);
    }

    fs.writeFile(PRODUCTS_PATH, JSON.stringify(productsCache, null, 2), 'utf8', err => {
        if (err) return res.status(500).json({ message: 'Error writing products file' });
        res.json({ success: true, productos: productsCache });
    });
});

app.delete('/api/producto/:id', (req, res) => {
    const { id } = req.params;
    const productId = Number(id);

    const productToDelete = productsCache.find(p => p.id === productId);

    if (!productToDelete) {
        return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (productToDelete.imagen && productToDelete.imagen.startsWith('/uploads/')) {
        const imageName = path.basename(productToDelete.imagen);
        const imagePath = path.join(UPLOADS_DIR, imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    productsCache = productsCache.filter(p => p.id !== productId);

    fs.writeFile(PRODUCTS_PATH, JSON.stringify(productsCache, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Error al escribir en el archivo de productos.' });
        res.json({ success: true, productos: productsCache });
    });
});

app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
        return res.status(500).json({ success: false, message: 'La configuración del servidor es incorrecta.' });
    }

    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (isMatch) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
