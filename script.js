import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const baseDeDatos = firebase.database();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


let productos = [];
let datosCliente = {};
let tasaCambio = 1; 

// Obtener la tasa de cambio desde Firebase
async function obtenerTasaCambio() {
  const snapshot = await baseDeDatos.ref("TasaCambio").once("value");
  if (snapshot.exists()) {
    tasaCambio = snapshot.val().tasa || 1;
  }
}

// inicio de sesión Usuario
document.getElementById("login-btn").addEventListener('click', (e) => {

  var correo = document.getElementById('emaillog').value;
  var contraseña = document.getElementById('passwordlog').value;

  signInWithEmailAndPassword(auth, correo, contraseña).then(cred => {
       alert("Usuario logueado");
       

       document.getElementById("login-section").style.display = "none";
       document.getElementById("client-section").style.display = "block";

  }).catch(error => {
    console.log(error); 
    const errorCode = error.code;
    if(errorCode == 'auth/invalid-email')
      alert('Correo no valido');
    else if(errorCode == 'auth/user-disabled')
      alert('usuario deshabilitado');
    else if(errorCode == 'auth/user-not-found')
      alert('usuario no existe');
    else if(errorCode == 'auth/wrong-password')
      alert('contraseña no valida');
    else
      alert('Error desconocido: ' + error.message); 
  });

});

   
  // inicio de sesión con google
document.getElementById("login-google").addEventListener('click', (e) => {
   
  signInWithPopup(auth, provider)
  .then((result) => {
   
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    

       document.getElementById("login-section").style.display = "none";
       document.getElementById("client-section").style.display = "block";
 
  }).catch((error) => {
    
    const errorCode = error.code;
    const errorMessage = error.message;
  
  });
});


 // inicio de sesión administrador con google
 document.getElementById("login-google-ad").addEventListener('click', (e) => {
   
  signInWithPopup(auth, provider)
  .then((result) => {
   
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    

    document.getElementById("admin-login-section").style.display = "none";
    document.getElementById("admin-panel-section").style.display = "block";
 
  }).catch((error) => {
    
    const errorCode = error.code;
    const errorMessage = error.message;
  
  });
});


// inicio de sesión Administrador
document.getElementById("admin-login-btn").addEventListener('click', (e) => {

  var correo = document.getElementById('admin-username').value;
  var contraseña = document.getElementById('admin-password').value;

  signInWithEmailAndPassword(auth, correo, contraseña).then(cred => {
       alert("Usuario logueado");
       console.log(cred.user);

       document.getElementById("admin-login-section").style.display = "none";
       document.getElementById("admin-panel-section").style.display = "block";

  }).catch(error => {
    console.error("Código de error:", error.code);
    console.error("Mensaje de error:", error.message);

    switch (error.code) {
      case 'auth/invalid-email':
        alert("Correo no válido");
        break;
      case 'auth/user-disabled':
        alert("Usuario deshabilitado");
        break;
      case 'auth/user-not-found':
        alert("Usuario no existe");
        break;
      case 'auth/wrong-password':
        alert("Contraseña no válida");
        break;
      default:
        alert("Error desconocido: " + error.message);
    }
  });

});

// acceso al inicio de sesión del administrador
document.getElementById("admin-access-btn").addEventListener("click", () => {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-login-section").style.display = "block";
});

// volver al inicio de sesión 
  document.getElementById("volver-btn").addEventListener("click", () => {
  document.getElementById("admin-login-section").style.display = "none";
  document.getElementById("login-section").style.display = "block";
});

// cerrar sesión administrador
document.getElementById("logout-admin-btn").addEventListener("click", () => {
  document.getElementById("admin-panel-section").style.display = "none";
  document.getElementById("login-section").style.display = "block";
});


// agregar producto
document.getElementById("add-new-product-btn").addEventListener("click", async () => {
  const nombreProducto = document.getElementById("new-product-name").value;
  const precioProducto = parseFloat(document.getElementById("new-product-price").value);
  const stockProducto = parseInt(document.getElementById("new-product-stock").value); 

  if (!nombreProducto || isNaN(precioProducto) || isNaN(stockProducto)) {
    alert("Por favor, complete todos los campos correctamente");
    return;
  }

  await baseDeDatos.ref("Productos").push({ 
    Nombre: nombreProducto, 
    Precio: precioProducto, 
    Stock: stockProducto, 
    MinimoStock: 10  
  });

  alert("Producto agregado correctamente");

});


document.addEventListener("DOMContentLoaded", async () => {
  await obtenerTasaCambio(); 

  const productos = await obtenerTodosLosProductos();
  const selectProductos = document.getElementById("product-select-ad");
  selectProductos.innerHTML = ""; 

 
  const defaultOption = document.createElement("option");
  defaultOption.text = "Seleccione un producto";
  defaultOption.value = "";
  selectProductos.appendChild(defaultOption);

  productos.forEach((producto) => {
    const option = document.createElement("option");
    option.value = producto.id; 
    option.text = `${producto.Nombre} - $${producto.Precio.toFixed(2)}`;
    selectProductos.appendChild(option);
  });

  selectProductos.addEventListener("change", (event) => {
    const productoSeleccionado = productos.find(p => p.id == event.target.value);
    if (productoSeleccionado) {
      
       document.getElementById("update-Product-btn").addEventListener("click", async () => {
         const nuevoPrecio = parseFloat(document.getElementById("product-price").value);
         const nuevoStock = parseInt(document.getElementById("product-stock").value);

         actualizarProducto(productoSeleccionado,nuevoPrecio,nuevoStock)

        });
      
    }
  });
});


async function actualizarProducto(producto, nuevoPrecio, nuevoStock) {
 
  const updates = {};

  if (!isNaN(nuevoPrecio)) {
    updates.Precio = nuevoPrecio;
  }

  if (!isNaN(nuevoStock)) {
    updates.Stock = nuevoStock;
  }

  if (Object.keys(updates).length === 0) {
    alert("No se proporcionaron valores válidos para actualizar");
    return;
  }

  try {
    await baseDeDatos.ref(`Productos/${producto.id}`).update(updates);
    alert("Producto actualizado correctamente");
  } catch (error) {
    console.error("Error al actualizar el producto: ", error);
    alert("Hubo un error al actualizar el producto");
  }
}


// actualizar tasa cambio
document.getElementById("update-exchange-rate-btn").addEventListener("click", async () => {
  const tasaCambioNueva = parseFloat(document.getElementById("exchange-rate").value);

  if (isNaN(tasaCambioNueva)) {
    alert("Ingrese una tasa válida");
    return;
  }

  await baseDeDatos.ref("TasaCambio").set({ tasa: tasaCambioNueva });
  alert("Tasa de cambio actualizada");
});



//  registro cliente
document.getElementById("client-next-btn").addEventListener("click", () => {
  const nombre = document.getElementById("client-name").value;
  const id = document.getElementById("client-id").value;

  if (nombre && id) {
    datosCliente = { name: nombre, id };
    document.getElementById("client-section").style.display = "none";
    document.getElementById("products-section").style.display = "block";
  } else {
    alert("Por favor, complete los datos del cliente");
  }
});



async function obtenerTodosLosProductos() {
  const productosRef = baseDeDatos.ref("Productos");
  const snapshot = await productosRef.once("value");
  const productos = [];

  snapshot.forEach((childSnapshot) => {
    const producto = childSnapshot.val();
    producto.id = childSnapshot.key;
    productos.push(producto);
  });

  return productos;
}



document.addEventListener("DOMContentLoaded", async () => {
  await obtenerTasaCambio(); 

  const productos = await obtenerTodosLosProductos();
  const selectProductos = document.getElementById("product-select");
  selectProductos.innerHTML = ""; 

 
  const defaultOption = document.createElement("option");
  defaultOption.text = "Seleccione un producto";
  defaultOption.value = "";
  selectProductos.appendChild(defaultOption);

  productos.forEach((producto) => {
    const option = document.createElement("option");
    option.value = producto.id; 
    option.text = `${producto.Nombre} - $${producto.Precio.toFixed(2)}`;
    selectProductos.appendChild(option);
  });

  selectProductos.addEventListener("change", (event) => {
    const productoSeleccionado = productos.find(p => p.id == event.target.value);
    if (productoSeleccionado) {
      seleccionarProducto(productoSeleccionado);
    }
  });
});





// anadir producto
async function seleccionarProducto(producto) {
 
  const productoRef = baseDeDatos.ref("Productos/" + producto.id);
  const snapshot = await productoRef.once("value");

  if (!snapshot.exists()) {
    alert("Error: Producto no encontrado en la base de datos.");
    return;
  }

  let stockActualizado = snapshot.val().Stock; 

  if (stockActualizado <= 0) {
    alert(`El producto "${producto.Nombre}" está agotado.`);
    return;
  }

  const cantidadVendida = 1; 
  

  const precioUSD = producto.Precio;
  const precioCOP = precioUSD * 4000;
  const precioBs = precioUSD * tasaCambio;

  productos.push({ id: producto.id, nombre: producto.Nombre, precio: precioUSD, cantidad: 1 });

  const listaProductos = document.getElementById("product-list");
  const itemProducto = document.createElement("div");
  itemProducto.classList.add("product-item");
  itemProducto.innerHTML = `
    <p>${producto.Nombre} - $${precioUSD.toFixed(2)} | COP ${precioCOP.toFixed(0)} | Bs ${precioBs.toFixed(2)}</p>
    <div class="right-controls">
      <div class="quantity-controls">
        <button class="quantity-btn minus-btn" data-id="${producto.id}">-</button>
        <span class="quantity" data-id="${producto.id}">1</span>
        <button class="quantity-btn plus-btn" data-id="${producto.id}">+</button>
      </div>
      <button class="remove-btn" data-id="${producto.id}">X</button>
    </div>
  `;

  listaProductos.appendChild(itemProducto);

  
  await actualizarStock(producto.id, cantidadVendida);

  
  itemProducto.querySelector(".remove-btn").addEventListener("click", async function () {
    const idProducto = this.getAttribute("data-id");
    const productoEliminado = productos.find(producto => producto.id == idProducto);
    productos = productos.filter(producto => producto.id !== idProducto);
    itemProducto.remove();
    actualizarDisplayTotal();
   
    await actualizarStock(idProducto, -productoEliminado.cantidad);
  });

 
  itemProducto.querySelector(".minus-btn").addEventListener("click", async function () {
    const idProducto = this.getAttribute("data-id");
    const producto = productos.find(producto => producto.id == idProducto);
    if (producto.cantidad > 1) {
      producto.cantidad--;
      itemProducto.querySelector(`.quantity[data-id="${idProducto}"]`).textContent = producto.cantidad;
      actualizarDisplayTotal();
      await actualizarStock(idProducto, -1);
    }
  });

  itemProducto.querySelector(".plus-btn").addEventListener("click", async function () {
    const idProducto = this.getAttribute("data-id");
    const producto = productos.find(producto => producto.id == idProducto);

    
    const snapshot = await baseDeDatos.ref("Productos/" + idProducto).once("value");
    let stockActualizado = snapshot.val().Stock;

    if (0 < stockActualizado ) {
      producto.cantidad++;
      itemProducto.querySelector(`.quantity[data-id="${idProducto}"]`).textContent = producto.cantidad;
      actualizarDisplayTotal();
      await actualizarStock(idProducto, 1);
    } else {
      alert("No hay más stock disponible para este producto.");
    }
  });

  actualizarDisplayTotal(); 
}





async function actualizarStock(productoId, cantidadVendida) {
  const productoRef = baseDeDatos.ref("Productos/" + productoId);
  const snapshot = await productoRef.once("value");

  if (snapshot.exists()) {
    let producto = snapshot.val();
    let nuevoStock = producto.Stock - cantidadVendida;

    if (nuevoStock < 0) {
      alert("Stock insuficiente para este producto.");
      return;
    }

    await productoRef.update({ Stock: nuevoStock });

   
    if (nuevoStock <= producto.MinimoStock) {
      alert(`¡Atención! El producto ${producto.Nombre} está bajo en stock (${nuevoStock} unidades).`);
    }
  }
}


function actualizarDisplayTotal() {
  const totalUSD = productos.reduce((suma, producto) => suma + (producto.precio * producto.cantidad), 0);
  const totalCOP = totalUSD * 4000;
  const totalBs = totalUSD * tasaCambio;

  document.getElementById("total-display").innerHTML =
  `<p>Total: $${totalUSD.toFixed(2)} | COP ${totalCOP.toFixed(0)} | Bs ${totalBs.toFixed(2)}</p>`;
}




// Finalizar Selección de Productos
document.getElementById("payment-next-btn").addEventListener("click", () => {
  if (productos.length > 0) {
    document.getElementById("products-section").style.display = "none";
    document.getElementById("payment-section").style.display = "block";
  } else {
    alert("Añada al menos un producto");
  }
});



/// Generar Factura y almacenar venta en Firebase
document.getElementById("generate-invoice-btn").addEventListener("click", async () => {
  const metodoPago = document.getElementById("payment-method").value;
  const totalUSD = productos.reduce((suma, producto) => suma + (producto.precio * producto.cantidad), 0);
  const totalCOP = totalUSD * 4000;
  const totalBs = totalUSD * tasaCambio;

  const factura = `
    <h3>Factura</h3>
    <p>Cliente: ${datosCliente.name}</p>
    <p>ID: ${datosCliente.id}</p>
    <p>Método de Pago: ${metodoPago}</p>
    <h4>Productos:</h4>
    ${productos
      .map((producto) => `<p>${producto.nombre} - $${producto.precio.toFixed(2)} x ${producto.cantidad}</p>`)
      .join("")}
    <h3>Total: $${totalUSD.toFixed(2)} | COP ${totalCOP.toFixed(0)} | Bs ${totalBs.toFixed(2)}</h3>
  `;

  document.getElementById("invoice").innerHTML = factura;
  document.getElementById("payment-section").style.display = "none";
  document.getElementById("invoice-section").style.display = "block";

  const venta = {
    cliente: datosCliente,
    productos: productos,
    totalUSD: totalUSD,
    totalCOP: totalCOP,
    totalBs: totalBs,
    metodoPago: metodoPago,
    fecha: new Date().toISOString()
    
  };

  await baseDeDatos.ref("Ventas").push(venta);
  alert("Venta registrada correctamente.");
});

async function generarReporteVentas() {
  try {
    
    const snapshotVentas = await baseDeDatos.ref("Ventas").once("value");
    const snapshotProductos = await baseDeDatos.ref("Productos").once("value");

    if (snapshotVentas.exists() && snapshotProductos.exists()) {
      const ventas = snapshotVentas.val();
      const productos = snapshotProductos.val();
      const hoy = new Date().toISOString().split("T")[0]; 

     
      const ventasHoy = Object.values(ventas).filter(venta => venta.fecha.split("T")[0] === hoy);

      
      const ingresosTotalesUSD = ventasHoy.reduce((suma, venta) => suma + (venta.totalUSD || 0), 0);
      const ingresosTotalesCOP = ventasHoy.reduce((suma, venta) => suma + (venta.totalCOP || 0), 0);
      const ingresosTotalesBs = ventasHoy.reduce((suma, venta) => suma + (venta.totalBs || 0), 0);

      

      
      const productosVendidos = ventasHoy.flatMap(venta => venta.productos || []);
      const productosAgrupados = productosVendidos.reduce((acumulador, producto) => {
        if (producto && producto.nombre) {
          if (acumulador[producto.nombre]) {
            acumulador[producto.nombre] += producto.cantidad || 0;
          } else {
            acumulador[producto.nombre] = producto.cantidad || 0;
          }
        }
        return acumulador;
      }, {});

      const productosMasVendidos = Object.entries(productosAgrupados)
        .sort((a, b) => b[1] - a[1])
        .map(([nombre, cantidad]) => `${nombre}: ${cantidad} unidades`);

        


      const productosBajoStock = Object.entries(productos)
        .filter(([key, producto]) => producto.Stock <= producto.MinimoStock)
        .map(([key, producto]) => `${producto.Nombre}: ${producto.Stock} unidades (Mínimo: ${producto.MinimoStock})`);

        


      const reporte = `
        <h3>Reporte de Ventas del Día</h3>
        <p>Ingresos Totales: $${ingresosTotalesUSD.toFixed(2)} | COP ${ingresosTotalesCOP.toFixed(0)} | Bs ${ingresosTotalesBs.toFixed(2)}</p>
        <h4>Productos Más Vendidos:</h4>
        <ul>
          ${productosMasVendidos.map(producto => `<li>${producto}</li>`).join("")}
        </ul>
        <h4>Productos por Debajo del Stock Mínimo:</h4>
        <ul>
          ${productosBajoStock.map(producto => `<li>${producto}</li>`).join("")}
        </ul>
      `;

      document.getElementById("reporte-content").innerHTML = reporte;
    } else {
      alert("No hay datos disponibles para generar el reporte.");
    }
  } catch (error) {
    console.error("Error al generar el reporte:", error);
    alert("Ocurrió un error al generar el reporte. Por favor, inténtalo de nuevo.");
  }
}

// Botón para generar reportes
document.getElementById("generar-reporte-btn").addEventListener("click", generarReporteVentas);


// Botón para acceder a la sección de reportes
document.getElementById("ver-reportes-btn").addEventListener("click", () => {
  document.getElementById("admin-panel-section").style.display = "none";
  document.getElementById("reporte-section").style.display = "block";
});



// Botón para volver al panel del administrador desde la sección de reportes
document.getElementById("volver-admin-btn").addEventListener("click", () => {
  document.getElementById("reporte-section").style.display = "none";
  document.getElementById("admin-panel-section").style.display = "block";
});



// Reiniciar Venta
document.getElementById("restart-btn").addEventListener("click", () => {
  productos = [];
  datosCliente = {};
  document.getElementById("invoice-section").style.display = "none";
  document.getElementById("client-section").style.display = "block";
  document.getElementById("product-list").innerHTML = "";
  document.getElementById("total-display").innerHTML = "";
});
