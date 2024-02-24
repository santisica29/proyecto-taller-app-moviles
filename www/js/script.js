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
let latitud;
let longitud;
navigator.geolocation.getCurrentPosition(setearCoordenadas);

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

    document
        .querySelector("#btnBuscarUsuariosEnPaises")
        .addEventListener("click", mostrarUsuariosEnPaises);
}

function tomarDatosLogin() {
    let username = document.getElementById("userL").value;
    let pw = document.getElementById("passwordL").value;

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
        mostrarToast(err, 5000);
    }
}

function logout() {
    localStorage.clear();
    NAV.push("page-home");
    armarMenuOpciones();
    cerrarMenu();
}

function tomarDatosRegistro() {
    let username = document.getElementById("usuarioR").value;
    let pw = document.getElementById("passwordR").value;
    let pais = document.getElementById("paisR").value;
    let cals = document.getElementById("caloriasR").value;

    if (pw === "" || username === "" || pais === undefined || cals === "") {
        mostrarToast("Todos los datos son obligatorios.", 3000);
        return;
    }

    registrar(username, pw, pais, cals);
}

async function registrar(username, pw, pais, cals) {
    let usuario = {};
    usuario.usuario = username;
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
        mostrarToast(err, 5000);
    }
}

async function mostrarCalorias() {
    mostrarLoader("Obteniendo calorias");
    await getCalorias();
    detenerLoader();

    document.querySelector(
        "#mostrarCalorias"
    ).innerHTML = `<ion-list><ion-item>Meta diaria de calorias: ${localStorage.getItem(
        "calorias"
    )}</ion-item></ion-list>
        <ion-list>
        <ion-item color=${calcCaloriasQueFaltanParaLlegarAlLimite()}>Calorias de hoy: ${caloriasDelDia} (${calcRestanteOSobranteDeCalorias()})</ion-item></ion-list>
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

function calcRestanteOSobranteDeCalorias() {
    let metaDiaria = localStorage.getItem("calorias");

    if (caloriasDelDia < metaDiaria) {
        return `+ ${metaDiaria - caloriasDelDia}`;
    } else {
        return `- ${caloriasDelDia - metaDiaria}`;
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
    let token = localStorage.getItem('token')

    if (RUTA == "/") {
        HOME.style.display = "block";
    } else if (RUTA == "/login") {
        LOGIN.style.display = "block";
    } else if (RUTA == "/registro") {
        REGISTRO.style.display = "block";
        poblarSelectDePaises();
    } else if (RUTA == "/cargar-alimentos") {
        if (!token){
            NAV.push("page-home");
            mostrarToast('Debe ingresar con su usuario primero', 3000);
            return;
        }
        CARGARALIMENTOS.style.display = "block";
        poblarSelectAlimentos();
    } else if (RUTA == "/lista-alimentos") {
        if (!token){
            NAV.push("page-home");
            mostrarToast('Debe ingresar con su usuario primero', 3000);
            return;
        }
        LISTARALIMENTOS.style.display = "block";
        getListaAlimentos();
    } else if (RUTA == "/calorias") {
        if (!token){
            NAV.push("page-home");
            mostrarToast('Debe ingresar con su usuario primero', 3000);
            return;
        }
        CALORIAS.style.display = "block";
        mostrarCalorias();
    } else if (RUTA == "/mapa") {
        if (!token){
            NAV.push("page-home");
            mostrarToast('Debe ingresar con su usuario primero', 3000);
            return;
        }
        MAPA.style.display = "block";
        mostrarMiUbicacion();
    }
}

async function registrarAlimento() {
    let idAlimento = document.querySelector("#comidaRegistro").value;
    let cantidad = Number(document.querySelector("#cantidadAlimento").value);
    let fecha = document.querySelector("#calendario").value;

    if (idAlimento === undefined || cantidad === 0) {
        mostrarToast("Todos los datos son obligatorios", 3500);
        return;
    }

    fecha = validarFecha(fecha);

    if (fechaEsMayorQueHoy(fecha)) {
        mostrarToast("La fecha no puede ser mayor que hoy", 3500);
        return;
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
        mostrarToast(err, 5000);
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
            slcAlimentos.innerHTML += `<ion-select-option value="${
                alimento.id
            }">${alimento.nombre} (${alimento.porcion.substring(
                alimento.porcion.length - 1
            )})</ion-select-option>`;
        }
        detenerLoader();
    } catch (err) {
        mostrarToast(err, 5000);
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
        mostrarToast(err, 5000);
    }
}
async function getListaAlimentos() {
    let lista = document.getElementById("lista-alimentos");
    let idUser = localStorage.getItem("idUser");

    try {
        mostrarLoader("Cargando lista de alimentos.");
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
            lista.innerHTML = `No tiene registros hechos.`;
        } else {
            lista.innerHTML = mostrarBotonDeListaFiltrada();

            for (let comida of data.registros) {
                for (let c of alimentos.alimentos) {
                    if (comida.idAlimento === c.id) {
                        let caloriasDeAlimento = calcCalorias(
                            comida.cantidad,
                            c.porcion,
                            c.calorias
                        );
                        let fecha =
                            comida.fecha === getFechaActual()
                                ? "Hoy"
                                : comida.fecha;

                        lista.innerHTML += crearCardDeComida(
                            fecha,
                            c.imagen,
                            c.nombre,
                            caloriasDeAlimento,
                            comida.id
                        );
                    }
                }
            }
        }
    } catch (err) {
        mostrarLoader(err, 8000);
    }
}

function mostrarBotonDeListaFiltrada() {
    return `<ion-item>
            <ion-datetime-button datetime="fecha1"></ion-datetime-button>
            <ion-modal>
              <ion-datetime id="fecha1" presentation="date" show-default-buttons="true" done-text="Confirmar" cancel-text="Cancelar">
              </ion-datetime>
            </ion-modal>
            <ion-datetime-button datetime="fecha2"></ion-datetime-button>
            <ion-modal>
              <ion-datetime id="fecha2" presentation="date" show-default-buttons="true" done-text="Confirmar" cancel-text="Cancelar">
              </ion-datetime>
            </ion-modal>
          </ion-item>

          <ion-item>
          <ion-button color="dark-purple" onclick="getListaFiltradaAlimentos()">Filtrar busqueda</ion-button>
          </ion-item>
          <ion-item>
          <ion-button color="dark-purple" onclick="getListaAlimentos()">Ver todos los registros</ion-button>
          </ion-item>`;
}

function crearCardDeComida(fecha, imagen, nombre, calorias, id) {
    return `<ion-card color="light-purple">
            <ion-card-header>
              <ion-card-subtitle>${fecha}</ion-card-subtitle>
              <ion-card-title><img src="https://calcount.develotion.com/imgs/${imagen}.png" /> ${nombre}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Calorias: ${calorias}
            </ion-card-content>
            <ion-button id="${id}" onclick="eliminarRegistro(this.id)" color="dark-purple">Eliminar Registro</ion-button>
          </ion-card>`;
}

function validarFecha(f) {
    if (f === undefined) {
        return getFechaActual();
    }

    if (f != getFechaActual()) {
        return recortarFecha(f);
    }
}

async function getListaFiltradaAlimentos() {
    let lista = document.getElementById("lista-alimentos");
    let idUser = localStorage.getItem("idUser");
    let f1 = document.getElementById("fecha1").value;
    let f2 = document.getElementById("fecha2").value;

    f1 = validarFecha(f1);
    f2 = validarFecha(f2);

    if (fechaEsMayorQueHoy(f1) || fechaEsMayorQueHoy(f2)) {
        mostrarToast("La fecha no puede ser mayor que hoy", 3500);
        return;
    }

    if (f1 > f2) {
        let aux = f2;
        f2 = f1;
        f1 = aux;
    }

    mostrarLoader("Cargando lista filtrada.");
    let listaFiltrada = await getListaFiltrada(f1, f2);

    if (listaFiltrada.length < 1) {
        lista.innerHTML = mostrarBotonDeListaFiltrada();
        lista.innerHTML += `<ion-item>No tiene registros hechos en esas fechas.</ion-item>`;
        detenerLoader();
        return;
    }

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

    lista.innerHTML = mostrarBotonDeListaFiltrada();
    for (let comida of listaFiltrada) {
        for (let c of alimentos.alimentos) {
            if (comida.idAlimento === c.id) {
                let caloriasDeAlimento = calcCalorias(
                    comida.cantidad,
                    c.porcion,
                    c.calorias
                );
                let fecha =
                    comida.fecha === getFechaActual() ? "Hoy" : comida.fecha;

                lista.innerHTML += crearCardDeComida(
                    fecha,
                    c.imagen,
                    c.nombre,
                    caloriasDeAlimento,
                    comida.id
                );
            }
        }
    }
}

async function getListaFiltrada(f1, f2) {
    let idUser = localStorage.getItem("idUser");
    let listaFiltrada = [];

    try {
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

        for (let comida of data.registros) {
            let fechaDelRegistro = new Date(comida.fecha);
            let fechaMenor = new Date(f1);
            let fechaMayor = new Date(f2);
            if (
                fechaDelRegistro >= fechaMenor &&
                fechaDelRegistro <= fechaMayor
            ) {
                listaFiltrada.push(comida);
            }
        }
    } catch (err) {
        mostrarLoader(err, 6000);
    }

    return listaFiltrada;
}

function fechaEsMayorQueHoy(f) {
    let hoy = new Date();
    let fecha = new Date(f);

    return fecha > hoy;
}

async function getCalorias() {
    let idUser = localStorage.getItem("idUser");
    let apiKey = localStorage.getItem("token");
    let headers = {
        headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
            iduser: idUser,
        },
    };

    try {
        const response = await fetch(
            `https://calcount.develotion.com/registros.php?idUsuario=${idUser}`,
            headers
        );

        const data = await response.json();

        const responseAlimentos = await fetch(
            "https://calcount.develotion.com/alimentos.php",
            headers
        );

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
    return Math.round((cantidad / porcion) * calorias);
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
        mostrarToast(err, 5000);
    }
}

function cerrarMenu() {
    MENU.close();
}

function ocultarTodo() {
    HOME.style.display = "none";
    LOGIN.style.display = "none";
    REGISTRO.style.display = "none";
    CARGARALIMENTOS.style.display = "none";
    LISTARALIMENTOS.style.display = "none";
    MAPA.style.display = "none";
    CALORIAS.style.display = "none";
}

// mostrarMiUbicacion()

function setearCoordenadas(position) {
    latitud = position.coords.latitude;
    longitud = position.coords.longitude;
}

function mostrarMiUbicacion(position) {
    setTimeout(function () {
        cargarMapa();
    }, 2000);
}
var map = null;

function cargarMapa() {
    if (map != null) {
        map.remove();
    }

    map = L.map("map").setView([latitud, longitud], 14);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    var marker1 = L.marker([latitud, longitud]).addTo(map);

    marker1.bindPopup("<b>Soy la ubicacion del usuario</b>");
}

async function buscarPaisesConMasCantidadDeUsuarios() {
    let cantidad = Number(document.querySelector("#cantidadUsuarios").value);

    if (cantidad === 0) {
        mostrarToast("Debe ingresar un valor mayor que 0", 2000);
        return;
    }

    let lista = [];

    const response = await fetch(
        `https://calcount.develotion.com/usuariosPorPais.php`,
        {
            headers: {
                "Content-Type": "application/json",
                apikey: localStorage.getItem("token"),
                iduser: localStorage.getItem("idUser"),
            },
        }
    );

    const data = await response.json();

    const responseListaPaisesCompleta = await fetch(
        "https://calcount.develotion.com/paises.php"
    );

    const dataListaPaisesCompleta = await responseListaPaisesCompleta.json();

    for (let pais of data.paises) {
        for (let p of dataListaPaisesCompleta.paises) {
            if (pais.cantidadDeUsuarios > cantidad && pais.id === p.id) {
                pais.longitud = p.longitude;
                pais.latitud = p.latitude;
                lista.push(pais);
            }
        }
    }

    return lista;
}

async function mostrarUsuariosEnPaises() {
    mostrarLoader("Cargando");
    const listaDePaisesConMasUsuarios = await buscarPaisesConMasCantidadDeUsuarios();
    detenerLoader();

    if (map != null) {
        map.remove();
    }

    map = L.map("map").setView([latitud, longitud], 3);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    for (let pais of listaDePaisesConMasUsuarios) {
        L.marker([pais.latitud, pais.longitud])
            .addTo(map)
            .bindPopup(`<br>${pais.name} - ${pais.cantidadDeUsuarios}</br>`);
    }
}
