// Función para mostrar mensajes
function mostrarMensaje(tipo, titulo, texto) {
    Swal.fire({
        icon: tipo,
        title: titulo,
        text: texto
    });
}

// Función para cargar productos desde el JSON
async function obtenerProductos() {
    try {
        const response = await fetch('/data/productos.json');
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }
        const data = await response.json();
        localStorage.setItem("productos", JSON.stringify(data.productos));
        return data.productos;
    } catch (error) {
        mostrarMensaje('error', 'Error al cargar productos', 'Usando datos de respaldo');
        
        // Si hay error al cargar el JSON, usar datos de respaldo
        const productosRespaldo = [
            {
                id: 1,
                nombre: "Chocolate + frutos secos",
                precio: 117624,
                imagen: "./assets/img/box-choco-frutos",
                categoria: "box"
            },
            {
                id: 2,
                nombre: "Chocolate",
                precio: 67207,
                imagen: "./assets/img/box-chocolate",
                categoria: "box"
            },
            {
                id: 3,
                nombre: "Combo Box",  
                precio: 2503,
                imagen: "./assets/img/combo-box",
                categoria: "combos"
            },
            {
                id: 4,
                nombre: "Combo Box 2",
                precio: 5446,
                imagen: "./assets/img/combo-box2",
                categoria: "combos"
            },
            {
                id: 5,
                nombre: "Combo Box 3",
                precio: 54602,
                imagen: "./assets/img/combo-box3",
                categoria: "combos"
            },
            {
                id: 6,
                nombre: "Torta Glitter",
                precio: 67207,
                imagen: "./assets/img/torta-glitter",
                categoria: "torta"
            },
            {
                id: 7,
                nombre: "Torta Tematica",
                precio: 28211,
                imagen: "./assets/img/torta-tematica",
                categoria: "torta"
            },
            {
                id: 8,
                nombre: "Torta Pop It",
                precio: 12605,
                imagen: "./assets/img/torta-popit",
                categoria: "torta"
            }
        ];
        localStorage.setItem("productos", JSON.stringify(productosRespaldo));
        return productosRespaldo;
    }
}

export { obtenerProductos, mostrarMensaje };