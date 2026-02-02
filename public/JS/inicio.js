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
const btnLimpiar = document.getElementById("btnLimpiarFiltros");
const logo = document.getElementById("logo");
const tituloPagina = document.getElementById("tituloPagina");

let productosDisponibles = [];
let todosLosProductos = [];
let carrito = [];
try {
    const carritoData = localStorage.getItem("carritoData");
    if (carritoData) {
        const { carritoGuardado, timestamp } = JSON.parse(carritoData);
        const ahora = new Date().getTime();
        const unaSemanaEnMilisegundos = 7 * 24 * 60 * 60 * 1000;

        if (ahora - timestamp < unaSemanaEnMilisegundos) {
            carrito = carritoGuardado;
        } else {
            localStorage.removeItem("carritoData");
            carrito = [];
        }
    }
} catch (error) {
    console.error("Error al parsear el carrito desde localStorage:", error);
    carrito = [];
}

const filtros = {
    busqueda: '',
    categoria: 'todos los productos',
    orden: 'default'
};
let checkoutModal;
let detalleModal;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        todosLosProductos = await obtenerProductos();
        productosDisponibles = [...todosLosProductos];

        dibujarCardProducto(productosDisponibles);
        checkoutModal = new bootstrap.Modal(document.getElementById('checkout-modal'));
        detalleModal = new bootstrap.Modal(document.getElementById('detalleProductoModal'));

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

        if (filtros.busqueda === '') {
            const cardEspecial = document.createElement("div");
            cardEspecial.className = "cardProducto";
            cardEspecial.innerHTML = `
                <img class="cardImg" src="./assets/img/torta-personalizada.png" alt="Torta Personalizada">
                <div class="cardInfo">
                    <h5 class="nombreProducto">Torta Personalizada a tu Gusto</h5>
                    <p class="cardPrecio">$ a cotizar</p>
                    <button class="botonCompra" id="botonCotizar">Cotizar por WhatsApp</button>
                </div>
            `;
            divProductos.append(cardEspecial);

            const botonCotizar = document.getElementById(`botonCotizar`);
            botonCotizar.addEventListener("click", () => {
                const numeroWhatsApp = '5493513018567';
                const mensaje = "¡Hola Caprichos! Quisiera cotizar una torta personalizada. ¿Me podrían ayudar?";
                const mensajeCodificado = encodeURIComponent(mensaje);
                const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensajeCodificado}`;
                window.open(urlWhatsApp, '_blank');
            });
        }

        productos.forEach((producto) => {
            const { imagen, nombre, precio, id, mostrarPrecio } = producto;
            
            // Lógica para mostrar precio o texto alternativo
            const precioDisplay = (mostrarPrecio !== false) ? `$${precio}` : "Consultar";
            
            const card = document.createElement("div");
            card.className = "cardProducto";
            card.innerHTML = `
                <img class="cardImg" src="${imagen}" alt="${nombre}" style="cursor: pointer;">
                <div class="cardInfo">
                    <h5 class="nombreProducto">${nombre}</h5>
                    <p class="cardPrecio">${precioDisplay}</p>
                    <div class="d-flex gap-2 w-100 justify-content-center">
                        <button class="btn btn-outline-primary btn-sm rounded-pill" id="botonDetalle${id}">Ver detalles</button>
                        <button class="botonCompra" id="botonComprar${id}">Agregar</button>
                    </div>
                </div>
            `;
            divProductos.append(card);

            // Evento para abrir modal de detalles (click en imagen o botón)
            const abrirDetalle = () => {
                document.getElementById('detalleTitulo').textContent = nombre;
                document.getElementById('detalleImagen').src = imagen;
                document.getElementById('detalleDescripcion').textContent = producto.descripcion || "Sin descripción detallada.";
                document.getElementById('detallePrecio').textContent = (mostrarPrecio !== false) ? `$${precio}` : "Precio a convenir";
                
                // Configurar el botón de agregar dentro del modal
                const btnAgregarModal = document.getElementById('detalleBotonAgregar');
                // Clonamos el botón para eliminar event listeners anteriores
                const nuevoBtn = btnAgregarModal.cloneNode(true);
                btnAgregarModal.parentNode.replaceChild(nuevoBtn, btnAgregarModal);
                
                nuevoBtn.addEventListener('click', () => {
                    agregarProducto(id);
                    detalleModal.hide();
                });

                detalleModal.show();
            };

            card.querySelector('.cardImg').addEventListener('click', abrirDetalle);
            document.getElementById(`botonDetalle${id}`).addEventListener('click', abrirDetalle);

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

const guardarCarritoEnStorage = () => {
    const carritoData = {
        carritoGuardado: carrito,
        timestamp: new Date().getTime()
    };
    localStorage.setItem("carritoData", JSON.stringify(carritoData));
};

const agregarProducto = (idProducto) => {
    try {
        const producto = todosLosProductos.find(
            (producto) => String(producto.id) === String(idProducto)
        ); if (!producto) throw new Error('Producto no encontrado');

        const productoEnCarrito = carrito.find(
            (item) => String(item.id) === String(idProducto)
        );

        if (!productoEnCarrito) {
            carrito.push({ ...producto, cantidad: 1, precioTotal: producto.precio });
        } else {
            productoEnCarrito.cantidad++;
            productoEnCarrito.precioTotal = producto.precio * productoEnCarrito.cantidad;
        }

        guardarCarritoEnStorage();
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
            const { imagen, nombre, precio, id, cantidad, precioTotal, mostrarPrecio } = producto;
            
            const precioUnitarioTexto = (mostrarPrecio !== false) ? `$${precio}` : "Consultar";
            const precioTotalTexto = (mostrarPrecio !== false) ? `$${precioTotal}` : "Consultar";

            const cardCarrito = document.createElement("div");
            cardCarrito.className = "cardCarrito";
            cardCarrito.innerHTML = `
                <img class="cardImg" src="${imagen}" alt="${nombre}">
                <div class="cardInfo">
                    <h5 class="nombreProducto">${nombre}</h5>
                    <p class="cardPrecio">Precio unitario: ${precioUnitarioTexto}</p>
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
                    <p class="cardPrecio">Precio Total: ${precioTotalTexto}</p>
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
            
            const tienePreciosOcultos = carrito.some(p => p.mostrarPrecio === false);
            const totalTexto = tienePreciosOcultos ? "A cotizar" : `$ ${calculaTotales().totalPagar}`;

            const totales = document.createElement("div");
            totales.className = "totales";
            totales.innerHTML = `
                <h4 class="totalTexto">Total a pagar: ${totalTexto}</h4>
                <button class="hacerCompra" id="finalizarCompraBtn">FINALIZAR PEDIDO</button>
                <button class="vaciarCarrito" id="vaciarCarritoBtn">Vaciar Carrito</button>
            `;

            carritoTotales.append(totales);

            document.getElementById('finalizarCompraBtn').addEventListener('click', handleCheckout);
            document.getElementById('vaciarCarritoBtn').addEventListener('click', vaciarCarrito);

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
        const indexCarrito = carrito.findIndex((producto) => String(producto.id) === String(id));
        const productoOriginal = todosLosProductos.find(p => String(p.id) === String(id));
        carrito[indexCarrito].cantidad++;
        carrito[indexCarrito].precioTotal = productoOriginal.precio * carrito[indexCarrito].cantidad;

        guardarCarritoEnStorage();
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
        const indexCarrito = carrito.findIndex((producto) => String(producto.id) === String(id));
        const productoOriginal = todosLosProductos.find(p => String(p.id) === String(id));

        carrito[indexCarrito].cantidad--;
        carrito[indexCarrito].precioTotal = productoOriginal.precio * carrito[indexCarrito].cantidad;

        if (carrito[indexCarrito].cantidad === 0) {
            carrito.splice(indexCarrito, 1);
        }

        guardarCarritoEnStorage();
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
        const indexCarrito = carrito.findIndex((producto) => String(producto.id) === String(id));
        if (indexCarrito === -1) return;

        carrito.splice(indexCarrito, 1);

        guardarCarritoEnStorage();
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
            guardarCarritoEnStorage();
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
    const customerReference = document.getElementById('customer-reference').value;

    if (!customerName || !customerAddress) {
        mostrarMensaje('error', 'Datos incompletos', 'Por favor, completa tu nombre y dirección.');
        return;
    }

    let mensaje = `¡Hola Caprichos Pastelería! 👋 Quiero hacer un pedido:\n\n`;
    mensaje += `*Cliente:* ${customerName}\n`;
    mensaje += `*Dirección de envío:* ${customerAddress}\n\n`;
    if (customerReference) {
        mensaje += `*Referencia:* ${customerReference}\n\n`;
    }
    mensaje += `*Mi pedido es:*\n`;

    carrito.forEach(producto => {
        const precioTexto = (producto.mostrarPrecio !== false) ? `$${producto.precioTotal}` : "Consultar";
        mensaje += `• ${producto.nombre} (x${producto.cantidad}) - ${precioTexto}\n`;
    });

    const tienePreciosOcultos = carrito.some(p => p.mostrarPrecio === false);
    const totalTexto = tienePreciosOcultos ? "A cotizar" : `$${calculaTotales().totalPagar}`;

    mensaje += `\n*Total a pagar: ${totalTexto}*`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroWhatsApp = '5493513018567';
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensajeCodificado}`;

    window.open(urlWhatsApp, '_blank');

    checkoutModal.hide();
    carrito = [];
    guardarCarritoEnStorage();
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

const resetearFiltros = () => {
    filtros.busqueda = '';
    filtros.categoria = 'todos los productos';
    filtros.orden = 'default';

    if (filtroInput) filtroInput.value = '';
    if (filtrarPrecio) filtrarPrecio.value = 'default';

    if (listaMenu) {
        listaMenu.querySelectorAll('a').forEach(a => {
            a.classList.remove('active');
            if (a.dataset.categoria && a.dataset.categoria.toLowerCase() === 'todos los productos') {
                a.classList.add('active');
            }
        });
    }

    aplicarFiltros();
};

if (btnLimpiar) btnLimpiar.addEventListener("click", resetearFiltros);

[logo, tituloPagina].forEach(elemento => {
    if (elemento) {
        elemento.addEventListener("click", (e) => {
            e.preventDefault();
            resetearFiltros();
        });
    }
});