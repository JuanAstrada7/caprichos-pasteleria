import { obtenerProductos, mostrarMensaje } from './productos.js';

// Elementos del DOM
const divProductos = document.getElementById("productos");
const divCarrito = document.getElementById("carritoConteiner");
const carritoTotales = document.getElementById("carritoTotal");
const cantidadCarrito = document.getElementById("cantidadProductos");
const modal = document.getElementById("modal");
const abrirCarrito = document.getElementById("abrirModal");
const cerrarCarrito = document.getElementById("cerrarModal");
const filtroInput = document.getElementById("filtroInput");
const listaMenu = document.getElementById("filtroLista");
const filtrarPrecio = document.getElementById("filtroPorPrecio");

// Variables globales
let productosDisponibles = [];
let todosLosProductos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// --- MEJORA: Estado centralizado para los filtros ---
const filtros = {
    busqueda: '',
    categoria: 'todos los productos',
    orden: 'default'
};
let checkoutModal; // Se inicializará en DOMContentLoaded

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    try {
        todosLosProductos = await obtenerProductos();
        productosDisponibles = [...todosLosProductos];
        
        dibujarCardProducto(productosDisponibles);
        // Inicializar el modal de Bootstrap después de que el DOM esté listo
        checkoutModal = new bootstrap.Modal(document.getElementById('checkout-modal'));

        // Mover la inicialización del formulario aquí para asegurar que el DOM está cargado
        const checkoutForm = document.getElementById('checkout-form');
        checkoutForm.addEventListener('submit', enviarPedidoWhatsApp);

        dibujarCarrito();
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al inicializar",
            "Por favor, recarga la página"
        );
    }
});

// --- MEJORA: Función única para aplicar todos los filtros ---
const aplicarFiltros = () => {
    try {
        // 1. Filtrar por búsqueda y categoría
        let productosFiltrados = todosLosProductos.filter(producto => {
            const coincideBusqueda = producto.nombre.toLowerCase().includes(filtros.busqueda);
            const coincideCategoria = filtros.categoria === 'todos los productos' || producto.categoria.toLowerCase() === filtros.categoria;
            return coincideBusqueda && coincideCategoria;
        });

        // 2. Ordenar
        switch (filtros.orden) {
            case 'asc':
                productosFiltrados.sort((a, b) => a.precio - b.precio);
                break;
            case 'desc':
                productosFiltrados.sort((a, b) => b.precio - a.precio);
                break;
            // 'default' no necesita hacer nada, mantiene el orden original
        }

        dibujarCardProducto(productosFiltrados);
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al aplicar filtros",
            "Intenta nuevamente"
        );
    }
};

const dibujarCardProducto = (productos) => {
    try {
        divProductos.innerHTML = "";
        productos.forEach((producto) => {
            const { imagen, nombre, precio, id } = producto;
            const card = document.createElement("div");
            card.className = "cardProducto";
            card.innerHTML = `
                <img class="cardImg" src="${imagen}" alt="${nombre}">
                <div class="cardInfo">
                    <h5 class="nombreProducto">${nombre}</h5>
                    <p class="cardPrecio">$${precio}</p>
                    <button class="botonCompra" id="botonComprar${id}">Agregar</button>
                </div>
            `;
            divProductos.append(card);

            const botonComprar = document.getElementById(`botonComprar${id}`);
            botonComprar.addEventListener("click", () => agregarProducto(id));
        });
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al mostrar productos",
            "Intenta recargar la página"
        );
    }
};

const agregarProducto = (idProducto) => {
    try {
        const producto = todosLosProductos.find(
            (producto) => producto.id === idProducto
        ); if (!producto) throw new Error('Producto no encontrado');

        const productoEnCarrito = carrito.find(
            (item) => item.id === idProducto
        );

        if (!productoEnCarrito) {
            carrito.push({ ...producto, cantidad: 1, precioTotal: producto.precio });
        } else {
            productoEnCarrito.cantidad++;
            productoEnCarrito.precioTotal = producto.precio * productoEnCarrito.cantidad;
        }

        localStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();

        mostrarMensaje(
            "success",
            `Se agregó ${producto.nombre} al carrito`,
            ""
        );
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al agregar producto",
            "Intenta nuevamente"
        );
    }
};

const dibujarCarrito = () => {
    try {
        divCarrito.innerHTML = "";
        carrito.forEach((producto) => {
            const { imagen, nombre, precio, id, cantidad, precioTotal } = producto;
            const cardCarrito = document.createElement("div");
            cardCarrito.className = "cardCarrito";
            cardCarrito.innerHTML = `
                <img class="cardImg" src="${imagen}" alt="${nombre}">
                <div class="cardInfo">
                    <h5 class="nombreProducto">${nombre}</h5>
                    <p class="cardPrecio">Precio unitario: $${precio}</p>
                    <div class="cardCarritoBotones">
                        <button class="cardCarritoSumar" id="botonSumar${id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
                            </svg>
                        </button>
                        <p>${cantidad}</p>
                        <button class="cardCarritoRestar" id="botonRestar${id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7z"/>
                            </svg>
                        </button>
                    </div>
                    <p class="cardPrecio">Precio Total: $${precioTotal}</p>
                </div>
            `;
            divCarrito.append(cardCarrito);

            const btnSumar = document.getElementById(`botonSumar${id}`);
            const btnRestar = document.getElementById(`botonRestar${id}`);

            btnSumar.addEventListener("click", () => sumarProducto(id));
            btnRestar.addEventListener("click", () => restarProducto(id));
        });
        dibujarCarritoTotales();
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al mostrar carrito",
            "Intenta nuevamente"
        );
    }
};

const dibujarCarritoTotales = () => {
    try {
        if (carrito.length > 0) {
            carritoTotales.innerHTML = "";
            const totales = document.createElement("div");
            totales.className = "totales";
            totales.innerHTML = `
                <h4 class="totalTexto">Total a pagar: $ ${calculaTotales().totalPagar}</h4>
                <button class="hacerCompra" id="finalizarCompraBtn">FINALIZAR PEDIDO</button>
            `;

            carritoTotales.append(totales);
            cantidadCarrito.innerHTML = `${calculaTotales().totalCantidad}`;
        } else {
            carritoTotales.innerHTML = `<h4>"Agrega productos para comprar"</h4>`;
            cantidadCarrito.innerHTML = `${calculaTotales().totalCantidad}`;
        }
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error en el carrito",
            "Intenta nuevamente"
        );
    }
};

const calculaTotales = () => {
    const totalPagar = carrito.reduce((total, { precioTotal }) => total + precioTotal, 0);
    const totalCantidad = carrito.reduce((total, { cantidad }) => total + cantidad, 0);
    return { totalPagar, totalCantidad };
};

const sumarProducto = (id) => {
    try {
        const indexCarrito = carrito.findIndex((producto) => producto.id === id);
        const productoOriginal = todosLosProductos.find(p => p.id === id);
        carrito[indexCarrito].cantidad++;
        carrito[indexCarrito].precioTotal = productoOriginal.precio * carrito[indexCarrito].cantidad;

        localStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al actualizar cantidad",
            "Intenta nuevamente"
        );
    }
};

const restarProducto = (id) => {
    try {
        const indexCarrito = carrito.findIndex((producto) => producto.id === id);
        const productoOriginal = todosLosProductos.find(p => p.id === id);

        carrito[indexCarrito].cantidad--;
        carrito[indexCarrito].precioTotal = productoOriginal.precio * carrito[indexCarrito].cantidad;

        if (carrito[indexCarrito].cantidad === 0) {
            carrito.splice(indexCarrito, 1);
        }

        localStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al actualizar cantidad",
            "Intenta nuevamente"
        );
    }
};

const handleCheckout = () => {
    // Cierra el modal del carrito
    modal.classList.remove("modalMostrar");
    // Abre el modal con el formulario de datos del cliente
    checkoutModal.show();
};

const enviarPedidoWhatsApp = (e) => {
    e.preventDefault();
    const customerName = document.getElementById('customer-name').value;
    const customerAddress = document.getElementById('customer-address').value;

    if (!customerName || !customerAddress) {
        mostrarMensaje('error', 'Datos incompletos', 'Por favor, completa tu nombre y dirección.');
        return;
    }

    // Construir el mensaje del pedido
    let mensaje = `¡Hola Caprichos Pastelería! 👋 Quiero hacer un pedido:\n\n`;
    mensaje += `*Cliente:* ${customerName}\n`;
    mensaje += `*Dirección de envío:* ${customerAddress}\n\n`;
    mensaje += `*Mi pedido es:*\n`;

    carrito.forEach(producto => {
        mensaje += `• ${producto.nombre} (x${producto.cantidad}) - $${producto.precioTotal}\n`;
    });

    mensaje += `\n*Total a pagar: $${calculaTotales().totalPagar}*`;

    // Codificar el mensaje para la URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroWhatsApp = '5493513018567'; // Reemplaza con tu número de WhatsApp
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensajeCodificado}`;

    // Abrir WhatsApp en una nueva pestaña
    window.open(urlWhatsApp, '_blank');

    // Limpiar el carrito y la UI
    checkoutModal.hide();
    carrito = [];
    localStorage.setItem("carrito", JSON.stringify(carrito));
    dibujarCarrito();

    mostrarMensaje(
        "success",
        "¡Pedido en camino!",
        "Se abrió WhatsApp para que envíes tu pedido. ¡Gracias por tu compra!"
    );
};

// Event Listeners
abrirCarrito.addEventListener("click", () => {
    try {
        modal.classList.add("modalMostrar");
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al abrir carrito",
            "Intenta nuevamente"
        );
    }
});

cerrarCarrito.addEventListener("click", () => {
    try {
        modal.classList.remove("modalMostrar");
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al cerrar carrito",
            "Intenta nuevamente"
        );
    }
});

// Listener para el botón de finalizar compra y el formulario de checkout
document.body.addEventListener('click', (e) => {
    if (e.target.id === 'finalizarCompraBtn') {
        handleCheckout();
    }
});

// --- MEJORA: Event Listeners refactorizados ---
filtroInput.addEventListener("input", (e) => {
    filtros.busqueda = e.target.value.toLowerCase().trim();
    aplicarFiltros();
});

listaMenu.addEventListener("click", (e) => {
    e.preventDefault(); // Evita que el enlace '#' recargue la página
    // Usamos dataset para obtener la categoría de forma más robusta
    if (e.target.dataset.categoria) {
        filtros.categoria = e.target.dataset.categoria.toLowerCase();
        
        // Opcional: Resaltar la categoría activa
        document.querySelectorAll('#filtroLista a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');

        aplicarFiltros();
    }
});

filtrarPrecio.addEventListener("change", (e) => {
    filtros.orden = e.target.value;
    aplicarFiltros();
});