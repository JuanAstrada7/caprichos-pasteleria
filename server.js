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

// Asegurarse de que el directorio de subidas exista
if (!fs.existsSync(UPLOADS_DIR)){
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- MEJORA: Caché de productos en memoria ---
let productsCache = [];
try {
    const data = fs.readFileSync(PRODUCTS_PATH, 'utf8');
    productsCache = JSON.parse(data);
} catch (error) {
    console.error("Error al cargar productos.json, iniciando con un array vacío.", error);
    productsCache = [];
}

// Configuración de Multer para guardar archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Crear un nombre de archivo único para evitar sobreescrituras
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json()); // <-- Volver a agregar esta línea
app.use(express.static(path.join(__dirname, 'public')));

// Rutas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para manejar la petición del favicon y evitar el 404
app.get('/favicon.ico', (req, res) => {
    res.status(204).send(); // 204 No Content
});

// API routes
app.get('/api/productos', (req, res) => {
    // Servir directamente desde la caché en memoria
    res.json({ productos: productsCache });
});

// Nueva ruta para guardar/actualizar un solo producto con imagen
// `upload.single('imagen')` procesa un archivo que viene en el campo 'imagen' del formulario
app.post('/api/producto', upload.single('imagen'), (req, res) => {
    // Los datos del formulario que no son archivos vienen en req.body
    const { id, nombre, precio, categoria, imagenAnterior } = req.body;
    const isEditing = id !== 'null' && id !== '';
    
    // La URL pública de la imagen
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : imagenAnterior;

    if (isEditing) {
        // Actualizar producto existente en la caché
        const productId = Number(id);
        productsCache = productsCache.map(p => p.id === productId ? { ...p, nombre, precio: Number(precio), categoria, imagen: imageUrl } : p);
    } else {
        // Crear nuevo producto en la caché
        const newProductData = {
            id: Date.now(), // ID único basado en el timestamp
            nombre,
            precio: Number(precio),
            categoria,
            imagen: imageUrl
        };
        productsCache.push(newProductData);
    }

    // Guardar la caché actualizada en el archivo
    fs.writeFile(PRODUCTS_PATH, JSON.stringify(productsCache, null, 2), 'utf8', err => {
        if (err) return res.status(500).json({ message: 'Error writing products file' });
        // Devolver la lista actualizada desde la caché
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

    // Eliminar la imagen del sistema de archivos si existe
    if (productToDelete.imagen && productToDelete.imagen.startsWith('/uploads/')) {
        const imageName = path.basename(productToDelete.imagen);
        const imagePath = path.join(UPLOADS_DIR, imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    // Filtrar el producto de la caché
    productsCache = productsCache.filter(p => p.id !== productId);

    // Guardar la caché actualizada en el archivo
    fs.writeFile(PRODUCTS_PATH, JSON.stringify(productsCache, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Error al escribir en el archivo de productos.' });
        res.json({ success: true, productos: productsCache });
    });
});

// Admin login
app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    // Ahora obtenemos el HASH desde las variables de entorno
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH; 

    if (!adminPasswordHash) {
        return res.status(500).json({ success: false, message: 'La configuración del servidor es incorrecta.' });
    }

    // Comparamos de forma segura la contraseña enviada con el hash almacenado
    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (isMatch) {
        res.json({ success: true }); // La contraseña es correcta
    } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
