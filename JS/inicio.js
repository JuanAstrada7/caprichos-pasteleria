import { obtenerProductos } from './productos.js';

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
let productosDisponibles;
let carrito = JSON.parse(sessionStorage.getItem("carrito")) || [];

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    try {
        productosDisponibles = JSON.parse(localStorage.getItem("productos"));
        
        if (!productosDisponibles) {
            productosDisponibles = await obtenerProductos();
        }
        
        dibujarCardProducto(productosDisponibles);
        dibujarCarrito();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al inicializar",
            text: "Por favor, recarga la página",
        });
    }
});

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
        Swal.fire({
            icon: "error",
            title: "Error al mostrar productos",
            text: "Intenta recargar la página",
        });
    }
};

const agregarProducto = (idProducto) => {
    try {
        const producto = productosDisponibles.find(
            (producto) => producto.id === idProducto
        );
        if (!producto) throw new Error('Producto no encontrado');

        const productoEnCarrito = carrito.find(
            (item) => item.id === idProducto
        );

        if (!productoEnCarrito) {
            carrito.push({...producto, cantidad: 1});
        } else {
            productoEnCarrito.cantidad++;
            productoEnCarrito.precio = producto.precio * productoEnCarrito.cantidad;
        }

        sessionStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();

        Swal.fire({
            position: "top-end",
            toast: true,
            icon: "success",
            title: `Se agregó ${producto.nombre} al carrito`,
            showConfirmButton: false,
            timer: 1000,
        });
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al agregar producto",
            text: "Intenta nuevamente",
        });
    }
};

const dibujarCarrito = () => {
    try {
        divCarrito.innerHTML = "";
        carrito.forEach((producto) => {
            const { imagen, nombre, precio, id, cantidad } = producto;
            const cardCarrito = document.createElement("div");
            cardCarrito.className = "cardCarrito";
            cardCarrito.innerHTML = `
                <img class="cardImg" src="${imagen}" alt="${nombre}">
                <div class="cardInfo">
                    <h5 class="nombreProducto">${nombre}</h5>
                    <p class="cardPrecio">Precio unitario: $${precio / cantidad}</p>
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
                    <p class="cardPrecio">Precio Total: $${precio}</p>
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
        Swal.fire({
            icon: "error",
            title: "Error al mostrar carrito",
            text: "Intenta nuevamente",
        });
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
                <a href="#" class="hacerCompra" id="hacerCompra">COMPRAR</a>
            `;

            carritoTotales.append(totales);
            cantidadCarrito.innerHTML = `${calculaTotales().totalCantidad}`;

            const comprar = document.getElementById("hacerCompra");
            comprar.addEventListener("click", () => {
                Swal.fire({
                    icon: "success",
                    title: "Compra realizada con éxito",
                    text: "Gracias por tu compra",
                    showConfirmButton: false,
                    timer: 2000,
                });
                carrito = [];
                sessionStorage.setItem("carrito", JSON.stringify(carrito));
                dibujarCarrito();
            });
        } else {
            carritoTotales.innerHTML = `<h4>"Agrega productos para comprar"</h4>`;
            cantidadCarrito.innerHTML = `${calculaTotales().totalCantidad}`;
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error en el carrito",
            text: "Intenta nuevamente",
        });
    }
};

const calculaTotales = () => {
    try {
        const totalPagar = carrito.reduce((total, { precio }) => total + precio, 0);
        const totalCantidad = carrito.reduce((total, { cantidad }) => total + cantidad, 0);
        return { totalPagar, totalCantidad };
    } catch (error) {
        return { totalPagar: 0, totalCantidad: 0 };
    }
};

const sumarProducto = (id) => {
    try {
        const indexCarrito = carrito.findIndex((producto) => producto.id === id);
        const precio = carrito[indexCarrito].precio / carrito[indexCarrito].cantidad;

        carrito[indexCarrito].cantidad++;
        carrito[indexCarrito].precio = precio * carrito[indexCarrito].cantidad;

        sessionStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al actualizar cantidad",
            text: "Intenta nuevamente",
        });
    }
};

const restarProducto = (id) => {
    try {
        const indexCarrito = carrito.findIndex((producto) => producto.id === id);
        const precio = carrito[indexCarrito].precio / carrito[indexCarrito].cantidad;

        carrito[indexCarrito].cantidad--;
        carrito[indexCarrito].precio = precio * carrito[indexCarrito].cantidad;

        if (carrito[indexCarrito].cantidad === 0) {
            carrito.splice(indexCarrito, 1);
        }

        sessionStorage.setItem("carrito", JSON.stringify(carrito));
        dibujarCarrito();
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al actualizar cantidad",
            text: "Intenta nuevamente",
        });
    }
};

// Event Listeners
abrirCarrito.addEventListener("click", () => {
    try {
        modal.classList.add("modalMostrar");
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al abrir carrito",
            text: "Intenta nuevamente",
        });
    }
});

cerrarCarrito.addEventListener("click", () => {
    try {
        modal.classList.remove("modalMostrar");
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al cerrar carrito",
            text: "Intenta nuevamente",
        });
    }
});

filtroInput.addEventListener("keyup", (e) => {
    try {
        const productoFiltrado = productosDisponibles.filter((producto) =>
            producto.nombre.toLowerCase().includes(e.target.value.toLowerCase())
        );

        if (e.target.value !== "") {
            productosDisponibles = productoFiltrado;
            dibujarCardProducto(productoFiltrado);
        } else {
            productosDisponibles = JSON.parse(localStorage.getItem("productos"));
            dibujarCardProducto(productosDisponibles);
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al filtrar productos",
            text: "Intenta nuevamente",
        });
    }
});

listaMenu.addEventListener("click", (e) => {
    try {
        const filtroCategoria = e.target.innerHTML.toLowerCase();

        if (filtroCategoria === "todos los productos") {
            productosDisponibles = JSON.parse(localStorage.getItem("productos"));
            dibujarCardProducto(productosDisponibles);
        } else {
            const productoFiltrado = productosDisponibles.filter((producto) =>
                producto.categoria.toLowerCase().includes(filtroCategoria)
            );
            dibujarCardProducto(productoFiltrado);
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al filtrar categoría",
            text: "Intenta nuevamente",
        });
    }
});

filtrarPrecio.addEventListener("click", (e) => {
    try {
        const orden = e.target.innerHTML;
        let productos;

        if (orden === "Ascendente") {
            productos = productosDisponibles.sort((a, b) => a.precio - b.precio);
        } else if (orden === "Descendente") {
            productos = productosDisponibles.sort((a, b) => b.precio - a.precio);
        }

        dibujarCardProducto(productos);
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error al ordenar productos",
            text: "Intenta nuevamente",
        });
    }
});