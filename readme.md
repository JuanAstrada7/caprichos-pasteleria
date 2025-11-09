# 🧁 Caprichos Pastelería

Proyecto full-stack de e-commerce para una pastelería, desarrollado con un frontend en HTML, CSS y JavaScript puro, y un backend en Node.js con Express.

## 📋 Descripción

Sitio web para Caprichos Pastelería que permite a los usuarios explorar y comprar productos. Incluye un carrito de compras interactivo, sistema de filtrado y un panel de administración completo para la gestión de productos.

## 🛠️ Tecnologías Utilizadas

**Frontend:**
- **HTML5** y **CSS3**
- **JavaScript (ES6+)**
- **Bootstrap 5**: Para componentes de UI y sistema de rejilla en el panel de administración.
- **SweetAlert2**: Para notificaciones y alertas personalizadas.

**Backend:**
- **Node.js** y **Express**: Para el servidor y la API REST.
- **bcrypt**: Para el hashing seguro de contraseñas de administrador.
- **Multer**: Para la gestión de subida de archivos (imágenes de productos).
- **Sharp**: Para el procesamiento y optimización de imágenes en tiempo real (conversión a `.webp` y redimensionado).
- **dotenv**: Para la gestión de variables de entorno.

## ✨ Características

- **Panel de Administración Seguro**: Acceso protegido por contraseña para gestionar productos.
- **Gestión de Productos (CRUD)**:
  - **Crear** nuevos productos con nombre, precio, categoría e imagen.
  - **Editar** la información de productos existentes.
  - **Eliminar** productos (y sus imágenes asociadas del servidor).
- **Optimización de Imágenes**: Las imágenes subidas se convierten a formato `.webp` y se redimensionan para mejorar el rendimiento del sitio.
- **Carrito de Compras**: Persistencia en `LocalStorage` para guardar el pedido del usuario hasta por una semana.
- **Filtrado y Búsqueda**: Filtros dinámicos por categoría, búsqueda por nombre y ordenamiento por precio.
- **Checkout vía WhatsApp**: Generación de un mensaje de pedido detallado para enviar por WhatsApp.
- **Diseño Responsivo**: Adaptable a dispositivos móviles y de escritorio.

## 🚀 Funcionalidades

**Para Clientes:**
- Visualizar el catálogo de productos.
- Agregar, modificar cantidad y eliminar productos del carrito.
- Filtrar productos por categoría, buscar por nombre y ordenar por precio.
- Finalizar el pedido ingresando datos de contacto y generando un mensaje para enviar por WhatsApp.

**Para Administradores:**
- Iniciar sesión de forma segura en la ruta `/admin`.
- Ver todos los productos en un panel de control.
- Añadir, editar y eliminar productos directamente desde la interfaz web.

## 📱 Redes Sociales

- **Instagram**: @caprichos.pastelera
- **WhatsApp**: Contacto directo

## 👩‍💻 Desarrollado por

Juan Astrada

## 🔧 Instalación y Uso

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/JuanAstrada7/capricho-pasteleria.git
    cd capricho-pasteleria
    ```

2.  **Instalar dependencias del servidor:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    - Crea un archivo `.env` en la raíz del proyecto.
    - Genera un hash para tu contraseña de administrador ejecutando el script `hash-generator.js`:
      ```bash
      node hash-generator.js
      ```
    - Copia el hash generado y agrégalo a tu archivo `.env` junto con el puerto:
      ```
      ADMIN_PASSWORD_HASH=tu_hash_seguro_aqui
      PORT=3000
      ```

4.  **Iniciar el servidor:**
    ```bash
    npm start
    ```

5.  Abre tu navegador y visita `http://localhost:3000` para ver la tienda o `http://localhost:3000/admin` para acceder al panel de administración.

