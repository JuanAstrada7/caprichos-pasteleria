require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_PATH = path.join(__dirname, 'data', 'productos.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Asegurarse de que el directorio de subidas exista
if (!fs.existsSync(UPLOADS_DIR)){
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
    fs.readFile(PRODUCTS_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading products file' });
        }
        res.json({ productos: JSON.parse(data) });
    });
});

// Nueva ruta para guardar/actualizar un solo producto con imagen
// `upload.single('imagen')` procesa un archivo que viene en el campo 'imagen' del formulario
app.post('/api/producto', upload.single('imagen'), (req, res) => {
    // Los datos del formulario que no son archivos vienen en req.body
    const { id, nombre, precio, categoria, imagenAnterior } = req.body;
    const isEditing = id !== 'null' && id !== '';

    // Leer los productos actuales
    fs.readFile(PRODUCTS_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading products file' });
        }
        let productos = JSON.parse(data);
        let newProductData;

        // La URL pública de la imagen
        // Si se subió un nuevo archivo (req.file existe), usamos su ruta. Si no, mantenemos la imagen anterior.
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : imagenAnterior;

        if (isEditing) {
            // Actualizar producto existente
            const productId = Number(id);
            productos = productos.map(p => p.id === productId ? { ...p, nombre, precio: Number(precio), categoria, imagen: imageUrl } : p);
        } else {
            // Crear nuevo producto
            newProductData = {
                id: Date.now(), // ID único basado en el timestamp
                nombre,
                precio: Number(precio),
                categoria,
                imagen: imageUrl
            };
            productos.push(newProductData);
        }
        // Guardar la lista de productos actualizada
        fs.writeFile(PRODUCTS_PATH, JSON.stringify(productos, null, 2), 'utf8', err => {
            if (err) return res.status(500).json({ message: 'Error writing products file' });
            res.json({ success: true, productos });
        });
    });
});

app.delete('/api/producto/:id', (req, res) => {
    const { id } = req.params;
    const productId = Number(id);

    fs.readFile(PRODUCTS_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error al leer el archivo de productos.' });
        }

        let productos = JSON.parse(data);
        const productToDelete = productos.find(p => p.id === productId);

        if (!productToDelete) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Eliminar la imagen del sistema de archivos
        if (productToDelete.imagen && productToDelete.imagen.startsWith('/uploads/')) {
            const imageName = path.basename(productToDelete.imagen);
            const imagePath = path.join(UPLOADS_DIR, imageName);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Usamos sync aquí por simplicidad en el flujo
            }
        }

        // Filtrar el producto y guardar el nuevo array
        const newProducts = productos.filter(p => p.id !== productId);
        fs.writeFile(PRODUCTS_PATH, JSON.stringify(newProducts, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ message: 'Error al escribir en el archivo de productos.' });
            res.json({ success: true, productos: newProducts });
        });
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
