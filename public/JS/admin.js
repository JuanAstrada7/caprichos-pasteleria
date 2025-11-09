import { obtenerProductos, mostrarMensaje } from './productos.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const logoutButton = document.getElementById('logout-button');
    const productList = document.getElementById('product-list');
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = new bootstrap.Modal(document.getElementById('product-modal'));
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');
    const productCategoryInput = document.getElementById('product-category');
    const imageHint = document.getElementById('image-hint');

    // State
    let allProducts = [];

    // API functions
    const api = {
        login: async (password) => {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!response.ok) throw new Error('Contraseña incorrecta');
            return response.json();
        },
        saveProducts: async (products) => {
            await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productos: products }),
            });
        }
    };

    // Functions
    const showAdminPanel = () => {
        loginContainer.classList.add('d-none');
        adminPanel.classList.remove('d-none');
        loadProducts();
    };

    const showLogin = () => {
        sessionStorage.removeItem('isAdminLoggedIn');
        loginContainer.classList.remove('d-none');
        adminPanel.classList.add('d-none');
        passwordInput.value = '';
    };

    const loadProducts = async () => {
        try {
            allProducts = await obtenerProductos();
            renderProducts();
        } catch (error) {
            console.error('Error al cargar productos:', error);
            mostrarMensaje('error', 'Error al cargar productos', error.message);
        }
    };

    const createProductCard = (product) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.productId = product.id;

        const img = document.createElement('img');
        img.src = product.imagen;
        img.className = 'card-img-top';
        img.alt = product.nombre;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = product.nombre;

        const price = document.createElement('p');
        price.className = 'card-text';
        price.textContent = `$${product.precio}`;

        const category = document.createElement('p');
        category.className = 'card-text';
        const small = document.createElement('small');
        small.className = 'text-muted';
        small.textContent = product.categoria;
        category.appendChild(small);

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary btn-sm me-2 edit-btn';
        editButton.textContent = 'Editar';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm delete-btn';
        deleteButton.textContent = 'Eliminar';

        cardBody.append(title, price, category, editButton, deleteButton);
        card.append(img, cardBody);
        col.appendChild(card);

        return col;
    };

    const renderProducts = () => {
        productList.innerHTML = '';
        allProducts.forEach(product => {
            const productCard = createProductCard(product);
            productList.appendChild(productCard);
        });
    };

    const openProductModal = (product = null) => {
        productForm.reset();
        if (product) {
            modalTitle.textContent = 'Editar Producto';
            productIdInput.value = product.id;
            productNameInput.value = product.nombre;
            productPriceInput.value = product.precio;
            // No establecemos el valor para el input de archivo, solo mostramos la ayuda
            imageHint.classList.remove('d-none');
            productCategoryInput.value = product.categoria;
        } else {
            modalTitle.textContent = 'Agregar Producto';
            productIdInput.value = '';
            imageHint.classList.add('d-none');
        }
        productModal.show();
    };

    const saveProductsAndRender = async () => {
        try {
            await api.saveProducts(allProducts);
            renderProducts();
        } catch (error) {
            console.error('Error al guardar productos:', error);
            mostrarMensaje('error', 'Error al guardar productos', 'No se pudieron guardar los cambios.');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            allProducts = allProducts.filter(p => p.id !== id);
            await saveProductsAndRender();
        }
    };

    // Event Listeners
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.login(passwordInput.value);
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            showAdminPanel();
        } catch (error) {
            console.error('Error en el login:', error);
            mostrarMensaje('error', 'Error en el login', error.message);
        }
    });

    logoutButton.addEventListener('click', showLogin);

    addProductBtn.addEventListener('click', () => openProductModal());

    productList.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.card');
        if (!card) return;

        const productId = Number(card.dataset.productId);

        if (target.classList.contains('edit-btn')) {
            const product = allProducts.find(p => p.id === productId);
            if (product) openProductModal(product);
        } else if (target.classList.contains('delete-btn')) {
            handleDeleteProduct(productId);
        }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const handleImageFile = (file) => {
            return new Promise((resolve, reject) => {
                if (!file) {
                    resolve(null); // No hay archivo nuevo
                    return;
                }
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
            });
        };

        try {
            const imageFile = productImageInput.files[0];
            const newImageDataUrl = await handleImageFile(imageFile);

            const productId = productIdInput.value ? Number(productIdInput.value) : Date.now();
            const isEditing = !!productIdInput.value;

            let productData = {
                id: productId,
                nombre: productNameInput.value,
                precio: Number(productPriceInput.value),
                categoria: productCategoryInput.value,
                imagen: newImageDataUrl, // Se asignará más adelante
            };

            if (isEditing) {
                const index = allProducts.findIndex(p => p.id === productId);
                if (index > -1) {
                    productData.imagen = newImageDataUrl || allProducts[index].imagen; // Mantener imagen anterior si no se sube una nueva
                    allProducts[index] = productData;
                }
            } else {
                if (!newImageDataUrl) throw new Error('Debes seleccionar una imagen para el nuevo producto.');
                productData.imagen = newImageDataUrl;
                allProducts.push(productData);
            }

            await saveProductsAndRender();
            productModal.hide();
        } catch (error) {
            mostrarMensaje('error', 'Error al guardar', error.message);
        }
    });

    // Initial Check
    if (sessionStorage.getItem('isAdminLoggedIn')) {
        showAdminPanel();
    }
});
