require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const session = require('express-session');
const sharp = require('sharp');
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

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'un-secreto-muy-seguro-por-defecto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) return res.status(401).json({ message: 'Acceso no autorizado. Debes iniciar sesión.' });
    next();
};

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

app.post('/api/producto', requireAdmin, upload.single('imagen'), async (req, res) => {
    const { id, nombre, precio, categoria, imagenAnterior } = req.body;

    if (!nombre || !precio || !categoria) {
        return res.status(400).json({ message: 'Nombre, precio y categoría son campos requeridos.' });
    }
    if (isNaN(Number(precio)) || Number(precio) <= 0) {
        return res.status(400).json({ message: 'El precio debe ser un número positivo.' });
    }

    let imageUrl = imagenAnterior;
    const isEditing = id !== 'null' && id !== '';
    let oldImagePath = null;

    if (req.file) {
        try {
            const filename = `capricho-${Date.now()}.webp`;
            const outputPath = path.join(UPLOADS_DIR, filename);

            await sharp(req.file.buffer)
                .resize({ width: 800, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(outputPath);

            imageUrl = `/uploads/${filename}`;

            if (isEditing && imagenAnterior && imagenAnterior.startsWith('/uploads/')) {
                oldImagePath = path.join(UPLOADS_DIR, path.basename(imagenAnterior));
            }

        } catch (error) {
            return res.status(500).json({ message: 'Error al procesar la imagen.' });
        }
    }

    if (isEditing) {
        const productId = Number(id);
        if (!imagenAnterior) {
            const originalProduct = productsCache.find(p => p.id === productId);
            if (originalProduct && originalProduct.imagen.startsWith('/uploads/')) {
                if (req.file) oldImagePath = path.join(UPLOADS_DIR, path.basename(originalProduct.imagen));
            }
        }

        productsCache = productsCache.map(p => p.id === productId ? { ...p, nombre, precio: Number(precio), categoria, imagen: imageUrl } : p);
    } else {
        const newProductData = {
            id: Date.now(),
            nombre,
            precio: Number(precio),
            categoria,
            imagen: imageUrl
        };
        if (!newProductData.imagen) {
            return res.status(400).json({ message: 'Se requiere una imagen para crear un nuevo producto.' });
        }
        productsCache.push(newProductData);
    }

    fs.writeFile(PRODUCTS_PATH, JSON.stringify(productsCache, null, 2), 'utf8', err => {
        if (err) return res.status(500).json({ message: 'Error writing products file' });
        if (oldImagePath && fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (unlinkErr) => { if (unlinkErr) console.error("Error al borrar imagen antigua:", unlinkErr); });
        }
        res.json({ success: true, productos: productsCache });
    });
});

app.delete('/api/producto/:id', requireAdmin, (req, res) => {
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
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'No se pudo cerrar la sesión.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Sesión cerrada correctamente.' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
