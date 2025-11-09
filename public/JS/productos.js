function mostrarMensaje(tipo, titulo, texto) {
    Swal.fire({
        icon: tipo,
        title: titulo,
        text: texto
    });
}

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
        return [];
    }
}

export { obtenerProductos, mostrarMensaje };