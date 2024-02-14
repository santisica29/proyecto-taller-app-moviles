const BASE = "https://calcount.develotion.com";
const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#ruteo");
const HOME = document.querySelector("#pantalla-home");
const LOGIN = document.querySelector("#pantalla-login");
const REGISTRO = document.querySelector("#pantalla-registro");
const CARGARALIMENTOS = document.querySelector("#pantalla-cargar-alimentos");
const LISTARALIMENTOS = document.querySelector("#pantalla-lista-alimentos");
const CALORIAS = document.querySelector("#pantalla-calorias");
const MAPA = document.querySelector("#pantalla-mapa");
const NAV = document.querySelector("ion-nav");
const loading = document.createElement("ion-loading");
let caloriasTotales;
let caloriasDelDia;

inicio();

function inicio() {
    eventos();
    armarMenuOpciones();
}

function armarMenuOpciones() {
    let hayToken = localStorage.getItem("token");
    let _menu = `<ion-item href="/" onclick="cerrarMenu()">Home</ion-item>`;

    if (hayToken) {
        _menu += `
        <ion-item href="/calorias" onclick="cerrarMenu()">Calorias</ion-item>
        <ion-item href="/cargar-alimentos" onclick="cerrarMenu()">Registrar alimento</ion-item>
        <ion-item href="/lista-alimentos" onclick="cerrarMenu()">Lista de alimentos</ion-item>
        <ion-item href="/mapa" onclick="cerrarMenu()">Mapa</ion-item>
        <ion-item onclick="logout()" style="cursor:pointer;">Logout</ion-item>`;
    } else {
        _menu += `<ion-item href="/login" onclick="cerrarMenu()">Login</ion-item>
        <ion-item href="/registro" onclick="cerrarMenu()">Registro</ion-item>`;
    }

    document.getElementById("menuOpciones").innerHTML = _menu;
}

function eventos() {
    ROUTER.addEventListener("ionRouteDidChange", navegar);
    document
        .querySelector("#btnRegistrar")
        .addEventListener("click", tomarDatosRegistro);
    document
        .querySelector("#btnLogin")
        .addEventListener("click", tomarDatosLogin);
    document
        .querySelector("#btnRegistrarComida")
        .addEventListener("click", registrarAlimento);
}

function tomarDatosLogin() {
    let username = document.getElementById("userL").value;
    let pw = document.getElementById("passwordL").value;
    // validar que no esten vacios.
    if (pw === "" || username === "") {
        mostrarToast("Todos los datos son obligatorios.", 3000);
        return;
    }

    iniciarSesion(username, pw);
}

async function iniciarSesion(username, password) {
    let user = {};
    user.usuario = username;
    user.password = password;

    mostrarLoader("Iniciando sesión");

    try {
        const response = await fetch(`${BASE}/login.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });

        const data = await response.json();

        detenerLoader();

        if (data.mensaje != null) {
            mostrarToast(data.mensaje, 2000);
        } else {
            mostrarToast("Login correcto", 2000);
            localStorage.setItem("token", data.apiKey);
            localStorage.setItem("idUser", data.id);
            localStorage.setItem("calorias", data.caloriasDiarias);
            armarMenuOpciones();
            NAV.push("page-home");
        }
    } catch (err) {
        console.log(err);
    }
}

function logout() {
    localStorage.clear();
    NAV.push("page-home");
    armarMenuOpciones();
    cerrarMenu();
}

function tomarDatosRegistro() {
    let user = document.getElementById("usuarioR").value;
    let pw = document.getElementById("passwordR").value;
    let pais = document.getElementById("paisR").value;
    let cals = document.getElementById("caloriasR").value;

    // validar que no esten vacios.
    if (pw === "" || username === "" || pais === undefined || cals === "") {
        mostrarToast("Todos los datos son obligatorios.", 3000);
        return;
    }

    registrar(user, pw, pais, cals);
}

async function registrar(user, pw, pais, cals) {
    let usuario = {};
    usuario.usuario = user;
    usuario.password = pw;
    usuario.idPais = pais;
    usuario.caloriasDiarias = cals;

    mostrarLoader("Registrandose");

    try {
        const response = await fetch(`${BASE}/usuarios.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(usuario),
        });

        const data = await response.json();

        detenerLoader();
        if (data.mensaje != null) {
            mostrarToast(data.mensaje, 2000);
        } else {
            localStorage.setItem("token", data.apiKey);
            localStorage.setItem("idUser", data.id);
            localStorage.setItem("calorias", data.caloriasDiarias);
            mostrarToast("Alta correcta", 2000);
            armarMenuOpciones();
            NAV.push("page-home");
        }
    } catch (err) {
        console.log(err);
    }
}

async function mostrarCalorias() {

    mostrarLoader('Obteniendo calorias');
    await getCalorias();
    detenerLoader();

    document.querySelector("#mostrarCalorias").innerHTML = `<ion-list><ion-item>Meta diaria de calorias: ${localStorage.getItem(
        "calorias"
    )}</ion.item></ion-list>
        <ion-list><ion-item color=${calcCaloriasQueFaltanParaLlegarAlLimite()}>Calorias de hoy: ${caloriasDelDia}</ion-item></ion-list>
        <ion-list><ion-item>Calorias totales registradas: ${caloriasTotales}</ion-item></ion-list>`;
}

function calcCaloriasQueFaltanParaLlegarAlLimite() {
    let metaDiaria = localStorage.getItem("calorias");
    if (caloriasDelDia > metaDiaria) {
        return "danger";
    } else if (
        caloriasDelDia >= metaDiaria * 0.9 &&
        caloriasDelDia <= metaDiaria
    ) {
        return "warning";
    } else {
        return "success";
    }
}

function mostrarLoader(texto) {
    loading.cssClass = "my-custom-class";
    loading.message = texto;
    //loading.duration = 2000;
    document.body.appendChild(loading);
    loading.present();
}

function detenerLoader() {
    loading.dismiss();
}

function mostrarToast(mensaje, duracion) {
    const toast = document.createElement("ion-toast");
    toast.message = mensaje;
    toast.duration = duracion;
    document.body.appendChild(toast);
    toast.present();
}

function navegar(e) {
    let RUTA = e.detail.to;
    ocultarTodo();

    if (RUTA == "/") {
        HOME.style.display = "block";
    } else if (RUTA == "/login") {
        LOGIN.style.display = "block";
    } else if (RUTA == "/registro") {
        REGISTRO.style.display = "block";
        poblarSelectDePaises();
    } else if (RUTA == "/cargar-alimentos") {
        CARGARALIMENTOS.style.display = "block";
        poblarSelectAlimentos();
    } else if (RUTA == "/lista-alimentos") {
        LISTARALIMENTOS.style.display = "block";
        getListaAlimentos();
    } else if (RUTA == "/calorias") {
        CALORIAS.style.display = "block";
        mostrarCalorias();
    } else if (RUTA == "/mapa") {
        MAPA.style.display = "block";
    }
}

async function registrarAlimento() {
    let idAlimento = document.querySelector("#comidaRegistro").value;
    let cantidad = document.querySelector("#cantidadAlimento").value;
    let fecha = document.querySelector("#calendario").value;

    if (idAlimento === "" || cantidad === "") {
        mostrarToast("Todos los datos son obligatorios");
        return;
    }

    if (fecha === undefined) {
        fecha = getFechaActual();
    } else {
        fecha = recortarFecha(fecha);
    }
    let idUser = localStorage.getItem("idUser");
    let comida = new Object();

    comida.idAlimento = idAlimento;
    comida.cantidad = cantidad;
    comida.fecha = fecha;
    comida.idUsuario = idUser;

    try {
        const response = await fetch(
            `https://calcount.develotion.com/registros.php`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: localStorage.getItem("token"),
                    iduser: idUser,
                },
                body: JSON.stringify(comida),
            }
        );
        const data = await response.json();

        mostrarToast("Alta correcta", 2000);
    } catch (err) {
        console.log(err);
    }
}

function getFechaActual() {
    const date = new Date();
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);

    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
}
function recortarFecha(fecha) {
    let indexOfT = fecha.indexOf("T");
    let fechaRecortada = fecha.substring(0, indexOfT);

    return fechaRecortada;
}
async function poblarSelectAlimentos() {
    let slcAlimentos = document.getElementById("comidaRegistro");

    mostrarLoader("Cargando alimentos");

    try {
        const response = await fetch(
            "https://calcount.develotion.com/alimentos.php",
            {
                headers: {
                    "Content-Type": "application/json",
                    apikey: localStorage.getItem("token"),
                    iduser: localStorage.getItem("idUser"),
                },
            }
        );

        const data = await response.json();

        for (let alimento of data.alimentos) {
            slcAlimentos.innerHTML += `<ion-select-option value="${alimento.id}">${alimento.nombre} (${alimento.porcion})</ion-select-option>`;
        }
        detenerLoader();
    } catch (err) {
        console.log(err);
    }
}

async function poblarSelectDePaises() {
    let slcPaises = document.getElementById("paisR");

    mostrarLoader("Cargando paises");

    try {
        const response = await fetch(
            "https://calcount.develotion.com/paises.php"
        );
        const data = await response.json();

        for (let pais of data.paises) {
            slcPaises.innerHTML += `<ion-select-option value="${pais.id}">${pais.name}</ion-select-option>`;
        }
        detenerLoader();
    } catch (err) {
        console.log(err);
    }
}
async function getListaAlimentos() {
    let lista = document.getElementById("lista-alimentos");
    let idUser = localStorage.getItem("idUser");

    try {
        mostrarLoader('Cargando lista de alimentos.')
        const response = await fetch(
            `https://calcount.develotion.com/registros.php?idUsuario=${idUser}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    apikey: localStorage.getItem("token"),
                    iduser: idUser,
                },
            }
        );

        const data = await response.json();

        const responseAlimentos = await fetch(
            "https://calcount.develotion.com/alimentos.php",
            {
                headers: {
                    "Content-Type": "application/json",
                    apikey: localStorage.getItem("token"),
                    iduser: idUser,
                },
            }
        );

        const alimentos = await responseAlimentos.json();

        detenerLoader();
        if (data.registros.length < 1) {
            lista.innerHTML = "No tiene registros hechos.";
        } else {
            lista.innerHTML = "";
            for (let comida of data.registros) {
                for (let c of alimentos.alimentos) {
                    if (comida.idAlimento === c.id) {
                        let caloriasDeAlimento = calcCalorias(
                            comida.cantidad,
                            c.porcion,
                            c.calorias
                        );
                        lista.innerHTML += `
                        <ion-card>
            <ion-card-header>
              <ion-card-subtitle>${comida.fecha}</ion-card-subtitle>
              <ion-card-title><img src="https://calcount.develotion.com/imgs/${c.imagen}.png" /> ${c.nombre}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Calorias: ${caloriasDeAlimento}
            </ion-card-content>
            <ion-button id="${comida.id}" onclick="eliminarRegistro(this.id)">Eliminar Registro</ion-button>
          </ion-card>`;
                    }
                }
            }
        }
    } catch (err) {
        mostrarLoader(err, 8000);
    }
}

async function getCalorias() {
    let idUser = localStorage.getItem("idUser");
    let apiKey = localStorage.getItem("token");
    let headers = {headers:{
        "Content-Type": "application/json",
        apikey: apiKey,
        iduser: idUser,
    }}

    try {
        const response = await fetch(`https://calcount.develotion.com/registros.php?idUsuario=${idUser}`, headers);

        const data = await response.json();

        const responseAlimentos = await fetch("https://calcount.develotion.com/alimentos.php", headers);

        const alimentos = await responseAlimentos.json();

        caloriasTotales = 0;
        caloriasDelDia = 0;
        for (let comida of data.registros) {
            for (let c of alimentos.alimentos) {
                if (comida.idAlimento === c.id) {
                    let caloriasDeAlimento = calcCalorias(
                        comida.cantidad,
                        c.porcion,
                        c.calorias
                    );
                    caloriasTotales += caloriasDeAlimento;
                    if (comida.fecha === getFechaActual()) {
                        caloriasDelDia += caloriasDeAlimento;
                    }
                }
            }
        }
    } catch (err) {
        mostrarLoader(err, 8000);
    }
}

function calcCalorias(cantidad, unidad, calorias) {
    let porcion = unidad.substring(0, unidad.length - 1);
    return (cantidad * porcion * calorias) / porcion;
}

async function eliminarRegistro(id) {
    try {
        const response = await fetch(
            `https://calcount.develotion.com/registros.php?idRegistro=${id}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    apikey: localStorage.getItem("token"),
                    iduser: localStorage.getItem("idUser"),
                },
            }
        );

        const data = await response.json();

        mostrarToast(data.mensaje, 4000);

        getListaAlimentos();
    } catch (err) {
        console.log(err);
    }
}

function cerrarMenu() {
    MENU.close();
}

function ocultarTodo() {
    LOGIN.style.display = "none";
    REGISTRO.style.display = "none";
    CARGARALIMENTOS.style.display = "none";
    LISTARALIMENTOS.style.display = "none";
    MAPA.style.display = "none";
    CALORIAS.style.display = "none";
}
