import { obtenerProductos, mostrarMensaje } from './productos.js';

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

let productosDisponibles = [];
let todosLosProductos = [];
let carrito = [];
try {
    const carritoGuardado = localStorage.getItem("carrito");
    carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
} catch (error) {
    console.error("Error al parsear el carrito desde localStorage:", error);
    carrito = []; // Inicia con un carrito vacío si hay un error
}

const filtros = {
    busqueda: '',
    categoria: 'todos los productos',
    orden: 'default'
};
let checkoutModal;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        todosLosProductos = await obtenerProductos();
        productosDisponibles = [...todosLosProductos];

        dibujarCardProducto(productosDisponibles);
        checkoutModal = new bootstrap.Modal(document.getElementById('checkout-modal'));

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

const aplicarFiltros = () => {
    try {
        let productosFiltrados = todosLosProductos.filter(producto => {
            const coincideBusqueda = producto.nombre.toLowerCase().includes(filtros.busqueda);
            const coincideCategoria = filtros.categoria === 'todos los productos' || producto.categoria.toLowerCase() === filtros.categoria;
            return coincideBusqueda && coincideCategoria;
        });

        switch (filtros.orden) {
            case 'asc':
                productosFiltrados.sort((a, b) => a.precio - b.precio);
                break;
            case 'desc':
                productosFiltrados.sort((a, b) => b.precio - a.precio);
                break;
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
                    <button class="cardCarritoEliminar" id="botonEliminar${id}" title="Eliminar producto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                        </svg>
                    </button>
                </div>
            `;
            divCarrito.append(cardCarrito);

            const btnSumar = document.getElementById(`botonSumar${id}`);
            const btnRestar = document.getElementById(`botonRestar${id}`);

            const btnEliminar = document.getElementById(`botonEliminar${id}`);

            btnSumar.addEventListener("click", () => sumarProducto(id));
            btnRestar.addEventListener("click", () => restarProducto(id));
            btnEliminar.addEventListener("click", () => eliminarProductoDelCarrito(id));
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
                <button class="vaciarCarrito" id="vaciarCarritoBtn">Vaciar Carrito</button>
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

const eliminarProductoDelCarrito = (id) => {
    try {
        const indexCarrito = carrito.findIndex((producto) => producto.id === id);
        if (indexCarrito === -1) return;

        carrito.splice(indexCarrito, 1);

        localStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();
    } catch (error) {
        mostrarMensaje(
            "error",
            "Error al eliminar producto",
            "Intenta nuevamente"
        );
    }
};

const vaciarCarrito = () => {
    mostrarMensajeConConfirmacion(
        '¿Estás seguro?',
        'Se eliminarán todos los productos de tu carrito.',
        'warning',
        'Sí, vaciar carrito'
    ).then((result) => {
        if (result.isConfirmed) {
            carrito = [];
            localStorage.setItem("carrito", JSON.stringify(carrito));
            dibujarCarrito();
            mostrarMensaje('success', '¡Carrito vacío!', 'Se han eliminado todos los productos.');
        }
    });
};

const mostrarMensajeConConfirmacion = (title, text, icon, confirmButtonText) => {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancelar'
    });
};

const handleCheckout = () => {
    modal.classList.remove("modalMostrar");
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

    let mensaje = `¡Hola Caprichos Pastelería! 👋 Quiero hacer un pedido:\n\n`;
    mensaje += `*Cliente:* ${customerName}\n`;
    mensaje += `*Dirección de envío:* ${customerAddress}\n\n`;
    mensaje += `*Mi pedido es:*\n`;

    carrito.forEach(producto => {
        mensaje += `• ${producto.nombre} (x${producto.cantidad}) - $${producto.precioTotal}\n`;
    });

    mensaje += `\n*Total a pagar: $${calculaTotales().totalPagar}*`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroWhatsApp = '5493513018567';
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensajeCodificado}`;

    window.open(urlWhatsApp, '_blank');

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

document.body.addEventListener('click', (e) => {
    if (e.target.id === 'finalizarCompraBtn') {
        handleCheckout();
    } else if (e.target.id === 'vaciarCarritoBtn') {
        vaciarCarrito();
    }
});

filtroInput.addEventListener("input", (e) => {
    filtros.busqueda = e.target.value.toLowerCase().trim();
    aplicarFiltros();
});

listaMenu.addEventListener("click", (e) => {
    e.preventDefault();
    if (e.target.dataset.categoria) {
        filtros.categoria = e.target.dataset.categoria.toLowerCase();

        document.querySelectorAll('#filtroLista a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');

        aplicarFiltros();
    }
});

filtrarPrecio.addEventListener("change", (e) => {
    filtros.orden = e.target.value;
    aplicarFiltros();
});