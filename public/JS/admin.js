import { obtenerProductos, mostrarMensaje } from './productos.js';

document.addEventListener('DOMContentLoaded', () => {
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

    let allProducts = [];
    let activeModalTrigger = null;

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
        saveProduct: async (formData) => {
            const response = await fetch('/api/producto', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin'; // Redirige al login si la sesión expiró
                }
                throw new Error('Error al guardar el producto');
            }
            return response.json();
        },
        deleteProduct: async (id) => {
            const response = await fetch(`/api/producto/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Error al eliminar el producto');
            return response.json();
        },
        logout: async () => {
            const response = await fetch('/api/logout', {
                method: 'POST',
            });
            if (!response.ok) throw new Error('Error al cerrar sesión');
            sessionStorage.removeItem('isAdminLoggedIn');
            return response.json();
        }
    };

    const showAdminPanel = () => {
        loginContainer.classList.add('d-none');
        adminPanel.classList.remove('d-none');
        loadProducts();
    };

    const showLogin = () => {
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
            try {
                const result = await api.deleteProduct(id);
                allProducts = result.productos;
                renderProducts();
                mostrarMensaje('success', 'Producto eliminado', 'El producto y su imagen han sido eliminados.');
            } catch (error) {
                mostrarMensaje('error', 'Error al eliminar', error.message);
            }
        }
    };

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

    logoutButton.addEventListener('click', async () => {
        try {
            await api.logout();
            showLogin();
        } catch (error) {
            mostrarMensaje('error', 'Error', 'No se pudo cerrar la sesión en el servidor.');
        }
    });

    addProductBtn.addEventListener('click', (e) => {
        activeModalTrigger = e.currentTarget;
        openProductModal();
    });

    productList.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.card');
        if (!card) return;

        const productId = Number(card.dataset.productId);

        if (target.classList.contains('edit-btn')) {
            activeModalTrigger = target;
            const product = allProducts.find(p => p.id === productId);
            if (product) openProductModal(product);
        } else if (target.classList.contains('delete-btn')) {
            handleDeleteProduct(productId);
        }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            const productId = productIdInput.value;
            const isEditing = !!productId;

            formData.append('id', isEditing ? productId : null);
            formData.append('nombre', productNameInput.value);
            formData.append('precio', productPriceInput.value);
            formData.append('categoria', productCategoryInput.value);

            const imageFile = productImageInput.files[0];
            if (imageFile) {
                formData.append('imagen', imageFile);
            } else if (isEditing) {
                const product = allProducts.find(p => p.id === Number(productId));
                formData.append('imagenAnterior', product.imagen);
            } else {
                throw new Error('Debes seleccionar una imagen para el nuevo producto.');
            }

            const result = await api.saveProduct(formData);
            allProducts = result.productos;
            renderProducts();
            productModal.hide();
        } catch (error) {
            mostrarMensaje('error', 'Error al guardar', error.message);
        }
    });

    document.getElementById('product-modal').addEventListener('hidden.bs.modal', () => {
        if (activeModalTrigger) {
            activeModalTrigger.focus();
        }
    });

    if (sessionStorage.getItem('isAdminLoggedIn')) {
        showAdminPanel();
    }
});
