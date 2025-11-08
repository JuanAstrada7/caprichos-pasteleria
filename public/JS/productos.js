// Función para mostrar mensajes
function mostrarMensaje(tipo, titulo, texto) {
    Swal.fire({
        icon: tipo,
        title: titulo,
        text: texto
    });
}

// Función para cargar productos desde la API
async function obtenerProductos() {
    try {
        const response = await fetch('/api/productos');
        if (!response.ok) {
            throw new Error(`Error al cargar productos: ${response.statusText}`);
        }
        const data = await response.json();
        return data.productos;
    } catch (error) {
        console.error(error);
        mostrarMensaje('error', 'Error al cargar productos', 'No se pudieron obtener los productos desde el servidor. Intenta recargar la página.');
        // Return an empty array or handle it as you see fit so the app doesn't crash
        return [];
    }
}

export { obtenerProductos, mostrarMensaje };