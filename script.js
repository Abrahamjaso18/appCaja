import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const db = firebase.database();
const auth = getAuth(app);
// Variables de Estado
let products = [];
let clientData = {};
let exchangeRate = 1; 




// Obtener la tasa de cambio desde Firebase
async function getExchangeRate() {
  const snapshot = await db.ref("TasaCambio").once("value");
  if (snapshot.exists()) {
    exchangeRate = snapshot.val().tasa || 1;
  }
}

// Mostrar el total de la venta en USD, COP y Bs
function updateTotalDisplay() {
  const totalUSD = products.reduce((sum, product) => sum + product.price, 0);
  const totalCOP = totalUSD * 4000;
  const totalBs = totalUSD * exchangeRate;

  document.getElementById("total-display").innerHTML = `
    <p>Total: $${totalUSD.toFixed(2)} | COP ${totalCOP.toFixed(0)} | Bs ${totalBs.toFixed(2)}</p>
  `;
}


// Inicio de Sesión Usuario
document.getElementById("login-btn").addEventListener('click', (e)=>{

  var email = document.getElementById('emaillog').value;
  var password = document.getElementById('passwordlog').value;

  signInWithEmailAndPassword(auth, email, password).then(cred=>{
       alert("Usuario logueado");
       console.log(cred.user);

       document.getElementById("login-section").style.display = "none";
       document.getElementById("client-section").style.display = "block";

  }).catch(error => {
    const errorCode = error.code;
    if(errorCode == 'auth/invalid-email')
      alert('Correo no valido');
    else if(errorCode == 'auth/user-disabled')
      alert('usuario desabilitado');
    else if(errorCode == 'auth/user-not-found')
      alert('usuario no existe');
    else if(errorCode == 'auth/wrong-password')
      alert('contrase;a no valida');
  });

});

// Acceso al inicio de sesión del administrador
document.getElementById("admin-access-btn").addEventListener("click", () => {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-login-section").style.display = "block";
});


// Inicio de Sesión Administrador
document.getElementById("admin-login-btn").addEventListener('click', (e)=>{

  var email = document.getElementById('admin-username').value;
  var password = document.getElementById('admin-password').value;

  signInWithEmailAndPassword(auth, email, password).then(cred=>{
       alert("Usuario logueado");
       console.log(cred.user);

       document.getElementById("admin-login-section").style.display = "none";
       document.getElementById("admin-panel-section").style.display = "block";

  }).catch(error => {
    const errorCode = error.code;
    if(errorCode == 'auth/invalid-email')
      alert("Correo no valido");
    else if(errorCode == 'auth/user-disabled')
      alert("usuario desabilitado");
    else if(errorCode == 'auth/user-not-found')
      alert("usuario no existe");
    else if(errorCode == 'auth/wrong-password')
      alert("contrase;a no valida");
  });

});

// Cerrar Sesión Administrador
document.getElementById("logout-admin-btn").addEventListener("click", () => {
  document.getElementById("admin-panel-section").style.display = "none";
  document.getElementById("login-section").style.display = "block";
});

// Agregar Producto
document.getElementById("add-new-product-btn").addEventListener("click", async () => {
  const productName = document.getElementById("new-product-name").value;
  const productPrice = parseFloat(document.getElementById("new-product-price").value);

  if (!productName || isNaN(productPrice)) {
    alert("Por favor, complete todos los campos");
    return;
  }

  await db.ref("Productos").push({ Nombre: productName, Precio: productPrice });
  alert("Producto agregado correctamente");
});

// Actualizar Tasa de Cambio
document.getElementById("update-exchange-rate-btn").addEventListener("click", async () => {
  const exchangeRate = parseFloat(document.getElementById("exchange-rate").value);

  if (isNaN(exchangeRate)) {
    alert("Ingrese una tasa válida");
    return;
  }

  await db.ref("TasaCambio").set({ tasa: exchangeRate });
  alert("Tasa de cambio actualizada");
});

// **2. Registro de Cliente**
document.getElementById("client-next-btn").addEventListener("click", () => {
  const name = document.getElementById("client-name").value;
  const id = document.getElementById("client-id").value;

  if (name && id) {
    clientData = { name, id };
    document.getElementById("client-section").style.display = "none";
    document.getElementById("products-section").style.display = "block";
  } else {
    alert("Por favor, complete los datos del cliente");
  }
});


// Buscar Producto en Firebase
async function buscarProductoEnFirebase(productName) {
  try {
    const snapshot = await db.ref("Productos").once("value");
    if (snapshot.exists()) {
      const productos = snapshot.val();

      for (let key in productos) {
        if (productos[key].Nombre.toLowerCase() === productName.toLowerCase()) {
          return { id: key, ...productos[key] }; // Retorna el producto encontrado con su ID
        }
      }
      return null; // Producto no encontrado
    } else {
      alert("No hay productos registrados en la base de datos.");
      return null;
    }
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    alert("Error al buscar el producto.");
    return null;
  }
}

// Añadir Producto
document.getElementById("add-product-btn").addEventListener("click", async () => {
  await getExchangeRate(); // Obtener la tasa de cambio actualizada

  const productName = document.getElementById("product-name").value;

  if (!productName) {
    alert("Por favor, ingrese el nombre del producto");
    return;
  }

  const producto = await buscarProductoEnFirebase(productName);

  if (producto) {
    const priceUSD = producto.Precio;
    const priceCOP = priceUSD * 4000;
    const priceBs = priceUSD * exchangeRate;

    products.push({ id: producto.id, name: producto.Nombre, price: priceUSD });

    const productList = document.getElementById("product-list");
    const productItem = document.createElement("div");
    productItem.classList.add("product-item");
    productItem.innerHTML = `
      <p>${producto.Nombre} - $${priceUSD.toFixed(2)} | COP ${priceCOP.toFixed(0)} | Bs ${priceBs.toFixed(2)}</p>
      <button class="remove-btn" data-id="${producto.id}">X</button>
    `;
    
    productList.appendChild(productItem);

    // Agregar evento para eliminar producto
    productItem.querySelector(".remove-btn").addEventListener("click", function () {
      const productId = this.getAttribute("data-id");
      products = products.filter(product => product.id !== productId);
      productItem.remove();
      updateTotalDisplay();
    });

    updateTotalDisplay(); // Actualizar el total
    document.getElementById("product-name").value = "";
  } else {
    alert("Producto no encontrado.");
  }
});

// Finalizar Selección de Productos
document.getElementById("payment-next-btn").addEventListener("click", () => {
  if (products.length > 0) {
    document.getElementById("products-section").style.display = "none";
    document.getElementById("payment-section").style.display = "block";
  } else {
    alert("Añada al menos un producto");
  }
});

// Generar Factura
document.getElementById("generate-invoice-btn").addEventListener("click", () => {
  const paymentMethod = document.getElementById("payment-method").value;
  const totalUSD = products.reduce((sum, product) => sum + product.price, 0);
  const totalCOP = totalUSD * 4000;
  const totalBs = totalUSD * exchangeRate;

  const invoice = `
    <h3>Factura</h3>
    <p>Cliente: ${clientData.name}</p>
    <p>ID: ${clientData.id}</p>
    <p>Método de Pago: ${paymentMethod}</p>
    <h4>Productos:</h4>
    ${products
      .map((product) => `<p>${product.name} - $${product.price.toFixed(2)}</p>`)
      .join("")}
    <h3>Total: $${totalUSD.toFixed(2)} | COP ${totalCOP.toFixed(0)} | Bs ${totalBs.toFixed(2)}</h3>
  `;

  document.getElementById("invoice").innerHTML = invoice;
  document.getElementById("payment-section").style.display = "none";
  document.getElementById("invoice-section").style.display = "block";
});

// Reiniciar Venta
document.getElementById("restart-btn").addEventListener("click", () => {
  products = [];
  clientData = {};
  document.getElementById("invoice-section").style.display = "none";
  document.getElementById("client-section").style.display = "block";
  document.getElementById("product-list").innerHTML = "";
  document.getElementById("total-display").innerHTML = "";
});


