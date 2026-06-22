const API_BASE = window.location.origin;

// 1. CREAMOS LA VARIABLE GLOBAL (Bien arriba como indicaste)
window.catalogoGlobal = [];
let catalogo = [];

function esPerfilInfantilActivo() {
    return (localStorage.getItem("perfil_infantil") || sessionStorage.getItem("perfil_infantil")) === "1" ||
           localStorage.getItem("control_parental") === "1" ||
           localStorage.getItem("control_parental") === "true";
}

function mostrarToast(texto, tipo = "info") {
    let contenedor = document.querySelector(".toast-container");

    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.className = "toast-container";
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.textContent = texto;

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 280);
    }, 2700);
}

function cerrarSesion() {
    localStorage.clear(); sessionStorage.clear();
    window.location.href = "index.html";
}

function obtenerPerfilId() {
    return (localStorage.getItem("perfil_id") || sessionStorage.getItem("perfil_id"));
}

async function verificarAccesoCatalogo() {
    const usuarioId = (localStorage.getItem("usuario_id") || sessionStorage.getItem("usuario_id"));

    if (!usuarioId || usuarioId === "undefined" || usuarioId === "null") {
        localStorage.removeItem("usuario_id");
        localStorage.setItem("volver_despues_login", "planes.html");
        window.location.href = "login.html";
        return false;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/suscripcion/${usuarioId}`);
        const suscripcion = await respuesta.json();

        if (!suscripcion || !suscripcion.estado || suscripcion.estado !== "activa") {
            window.location.href = "planes.html";
            return false;
        }

        return true;

    } catch (error) {
        console.log("Error al verificar suscripción:", error);
        window.location.href = "planes.html";
        return false;
    }
}

function protegerPerfil() {
    const usuario_id = (localStorage.getItem("usuario_id") || sessionStorage.getItem("usuario_id"));
    const perfil_id = obtenerPerfilId();

    if (!usuario_id || usuario_id === "undefined" || usuario_id === "null") {
        localStorage.removeItem("usuario_id");
        window.location.href = "login.html";
        return false;
    }

    if (!perfil_id || perfil_id === "undefined" || perfil_id === "null") {
        window.location.href = "seleccionar-perfil.html";
        return false;
    }

    return true;
}

function normalizarImagen(imagen) {
    if (!imagen) return "img/backdrop.jpg";

    if (imagen.startsWith("http") || imagen.startsWith("img/")) {
        return imagen;
    }

    return `img/${imagen}`;
}

function escapeHTML(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function cardContenido(item, opciones = {}) {
    const porcentaje = Number(item.porcentaje || 0);

    const progreso = opciones.progreso
        ? `
            <div class="progress-wrap">
                <div class="progress-bar" style="width:${Math.min(porcentaje, 100)}%"></div>
            </div>
        `
        : "";

    const etiquetaInfantil = Number(item.infantil) === 1
        ? `<span class="badge-kids">Infantil</span>`
        : "";

    return `
        <article class="card">
            <img 
                src="${normalizarImagen(item.imagen)}" 
                class="poster" 
                alt="${escapeHTML(item.titulo)}" 
                style="cursor: pointer;" 
                onclick="verAhora(${item.id})"
            >

            <div class="card-info">
                <h3>${escapeHTML(item.titulo)}</h3>
                <p>
                    ${escapeHTML(item.tipo || "Contenido")} · 
                    ${escapeHTML(item.genero || "Sin género")}
                </p>

                ${etiquetaInfantil}
                ${progreso}

                <div class="card-actions">
                    <button onclick="verAhora(${item.id})">
                        ${opciones.progreso ? "Continuar" : "Ver ahora"}
                    </button>

                    <button id="btn-lista-${item.id}" onclick="agregarMiLista(${item.id})">
                        + Mi Lista
                    </button>
                </div>
            </div>
        </article>
    `;
}

function cardTMDB(item) {
    return `
        <article class="card">
            <img 
                src="${normalizarImagen(item.imagen)}" 
                class="poster" 
                alt="${escapeHTML(item.titulo)}" 
                style="cursor: pointer;" 
                onclick="verAhoraTMDB(${item.tmdb_id})"
            >

            <div class="card-info">
                <h3>${escapeHTML(item.titulo)}</h3>
                <p>TMDb · ⭐ ${Number(item.calificacion || 0).toFixed(1)}</p>

                <div class="card-actions">
                    <button onclick="verAhoraTMDB(${item.tmdb_id})">
                        Ver ahora
                    </button>

                    <button onclick="agregarMiListaTMDB(${item.tmdb_id})">
                        + Mi Lista
                    </button>
                </div>
            </div>
        </article>
    `;
}

function mostrarAvisoPerfilInfantil() {
    let aviso = document.getElementById("avisoPerfilInfantil");

    if (aviso) return;

    const main = document.querySelector("main") || document.body;

    aviso = document.createElement("div");
    aviso.id = "avisoPerfilInfantil";
    aviso.className = "aviso-infantil";
    aviso.innerText = "Perfil infantil activo: solo se muestra contenido apto para niños.";

    main.prepend(aviso);
}

// 2. ACTUALIZA TU FUNCIÓN DE CARGAR CATÁLOGO
async function cargarCatalogo() {
    try {
        const respuesta = await fetch(`${API_BASE}/contenido`);
        const lista = await respuesta.json();

        // 🟢 ESTE ES EL AJUSTE FINAL CLAVE 🟢
        window.catalogoGlobal = lista;
        catalogo = lista; // Por si alguna función vieja lo usa

        const contenedor = document.getElementById("catalogo");
        if (!contenedor) return;
        contenedor.innerHTML = "";

        if (!lista || lista.length === 0) {
            contenedor.innerHTML = `<div class="empty-state">No hay contenido disponible.</div>`;
            return;
        }

        // Usamos tu función cardContenido
        contenedor.innerHTML = lista.map(item => cardContenido(item)).join(""); 
    } catch (error) {
        console.log("Error al cargar el catálogo:", error);
    }
}

// 3. LA FUNCIÓN DEL BUSCADOR INTELIGENTE EN TIEMPO REAL (VERSIÓN DESPLEGABLE)
function buscadorInteligente() {
    const inputElement = document.getElementById("searchInputTop") || document.getElementById("buscar");
    const searchDropdown = document.getElementById("searchDropdown");
    
    if (!inputElement || !searchDropdown) return;
    
    const query = inputElement.value.toLowerCase().trim();

    // Ocultar cajón si no hay texto o es muy corto
    if (query.length === 0) {
        searchDropdown.classList.add("oculto");
        return;
    }

    if (!window.catalogoGlobal) return;

    // Filtramos el contenido global en memoria
    const filtrados = window.catalogoGlobal.filter(item => 
        (item.titulo && item.titulo.toLowerCase().includes(query)) || 
        (item.genero && item.genero.toLowerCase().includes(query)) ||
        (item.tipo && item.tipo.toLowerCase().includes(query))
    );

    // Limpiamos el cajón flotante
    searchDropdown.innerHTML = "";

    if (filtrados.length === 0) {
        searchDropdown.innerHTML = `<p style="color: #a3a3a3; text-align: center; margin: 10px 0; font-size: 13px;">No se encontraron resultados.</p>`;
    } else {
        // Llenamos el cajón con los primeros 6 resultados
        filtrados.slice(0, 6).forEach(item => {
            const enlace = document.createElement("a");
            enlace.className = "search-item";
            enlace.href = `reproductor.html?id=${item.id}`;
            
            enlace.innerHTML = `
                <img src="${normalizarImagen(item.imagen)}" alt="${escapeHTML(item.titulo)}">
                <div class="search-item-info">
                    <h4>${escapeHTML(item.titulo)}</h4>
                    <span>${escapeHTML(item.genero || "Sin género")}</span>
                </div>
            `;
            searchDropdown.appendChild(enlace);
        });
    }

    // Mostramos el cajón
    searchDropdown.classList.remove("oculto");
}

// Ocultar el dropdown si el usuario hace clic en cualquier otra parte de la pantalla
document.addEventListener("click", function(event) {
    const inputElement = document.getElementById("searchInputTop") || document.getElementById("buscar");
    const searchDropdown = document.getElementById("searchDropdown");
    
    if (inputElement && searchDropdown) {
        if (!inputElement.contains(event.target) && !searchDropdown.contains(event.target)) {
            searchDropdown.classList.add("oculto");
        }
    }
});

function mostrarCatalogo(lista) {
    const contenedor = document.getElementById("catalogo");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                No se encontraron resultados.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = lista.map(item => cardContenido(item)).join("");
}



async function agregarMiLista(contenido_id) {
    const perfil_id = obtenerPerfilId();

    if (!perfil_id) {
        window.location.href = "seleccionar-perfil.html";
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/mi-lista`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                perfil_id,
                contenido_id
            })
        });

        const datos = await respuesta.json();

        if (datos.ok) {
            const btn = document.getElementById(`btn-lista-${contenido_id}`);
            if (btn) {
                btn.innerText = "✓ Agregado";
                btn.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                btn.style.color = "white";
                btn.disabled = true;
            }
        }

        mostrarToast(
            datos.mensaje || "Agregado a Mi Lista",
            datos.ok ? "ok" : "error"
        );

    } catch (error) {
        console.log("Error al agregar a Mi Lista:", error);
        mostrarToast("No se pudo agregar a Mi Lista", "error");
    }
}

async function verAhora(id) {
    const perfil_id = obtenerPerfilId();

    if (!perfil_id) {
        window.location.href = "seleccionar-perfil.html";
        return;
    }

    try {
        await fetch(`${API_BASE}/historial`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                perfil_id,
                contenido_id: id
            })
        });

    } catch (error) {
        console.log("No se pudo registrar historial:", error);
    }

    window.location.href = `reproductor.html?id=${id}`;
}

async function cargarContinuarViendo() {
    const perfil_id = obtenerPerfilId();
    const contenedor = document.getElementById("continuarViendo");

    if (!contenedor) return;

    try {
        const respuesta = await fetch(`${API_BASE}/continuar/${perfil_id}`);
        let lista = await respuesta.json();

        if (esPerfilInfantilActivo()) {
            lista = lista.filter(item => {
                return Number(item.infantil) === 1;
            });
        }

        contenedor.innerHTML = "";

        if (!lista || lista.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    Aún no tienes contenido pendiente en este perfil.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = lista
            .map(item => cardContenido(item, { progreso: true }))
            .join("");

    } catch (error) {
        console.log("Error al cargar Continuar viendo:", error);

        contenedor.innerHTML = `
            <div class="empty-state">
                No se pudo cargar Continuar viendo.
            </div>
        `;
    }
}

async function cargarTMDB() {
    const contenedor = document.getElementById("tmdbCatalogo");

    if (!contenedor) return;

    if (esPerfilInfantilActivo()) {
        contenedor.innerHTML = "";
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/tmdb/populares`);
        const peliculas = await respuesta.json();

        if (!peliculas || peliculas.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    No se pudo cargar TMDb en este momento.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = peliculas
            .slice(0, 12)
            .map(item => cardTMDB(item))
            .join("");

    } catch (error) {
        console.log("Error al cargar TMDb:", error);

        contenedor.innerHTML = `
            <div class="empty-state">
                No se pudo conectar con TMDb.
            </div>
        `;
    }
}

async function importarTMDB(tmdb_id) {
    if (esPerfilInfantilActivo()) {
        mostrarToast("TMDb no está disponible en perfiles infantiles", "error");
        return null;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/tmdb/importar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ tmdb_id })
        });

        const contenido = await respuesta.json();

        if (contenido.error) {
            mostrarToast(
                contenido.mensaje || "No se pudo importar desde TMDb",
                "error"
            );
            return null;
        }

        return contenido;

    } catch (error) {
        console.log("Error al importar desde TMDb:", error);
        mostrarToast("No se pudo conectar con TMDb", "error");
        return null;
    }
}

async function verAhoraTMDB(tmdb_id) {
    const contenido = await importarTMDB(tmdb_id);

    if (!contenido) return;

    await verAhora(contenido.id);
}

async function agregarMiListaTMDB(tmdb_id) {
    const contenido = await importarTMDB(tmdb_id);

    if (!contenido) return;

    await agregarMiLista(contenido.id);
}

// ==========================================
// HU15: RECOMENDACIONES PERSONALIZADAS
// ==========================================
async function cargarRecomendacionesUsuario() {
    const perfil_id = localStorage.getItem("perfil_id") || sessionStorage.getItem("perfil_id");
    
    const contenedor = document.getElementById("contenedorRecomendados");
    const fila = document.getElementById("rowRecomendados");
    const titulo = document.getElementById("tituloRecomendados");

    if (!contenedor || !fila) return;

    try {
        const respuesta = await fetch(`${API_BASE}/recomendaciones/historial/${perfil_id}`);
        const datos = await respuesta.json();

        if (!datos.ok || !datos.recomendaciones || datos.recomendaciones.length === 0) {
            fila.style.display = "none";
            return;
        }

        fila.style.display = "block";
        if (titulo) titulo.innerText = `Porque viste ${datos.genero}`; 
        
        contenedor.innerHTML = datos.recomendaciones.map(item => cardContenido(item)).join("");
    } catch (error) {
        fila.style.display = "none";
    }
}

// ==========================================
// MENÚ DESPLEGABLE Y ADMINISTRACIÓN DE PERFIL
// ==========================================

async function cargarDatosTopbar() {
    const usuario_id = localStorage.getItem("usuario_id") || sessionStorage.getItem("usuario_id");
    const perfil_id = localStorage.getItem("perfil_id") || sessionStorage.getItem("perfil_id");
    
    try {
        const res = await fetch(`${API_BASE}/perfiles/${usuario_id}`);
        const perfiles = await res.json();
        const actual = perfiles.find(p => String(p.id) === String(perfil_id));
        
        if (actual) {
            document.getElementById("navAvatar").src = normalizarImagen(actual.avatar || "Red.jpg");
            document.getElementById("navNombrePerfil").innerText = actual.nombre;
            window.perfilActualData = actual; 
        }
    } catch (e) {}
}

function abrirEdicionPerfilActual() {
    if (!window.perfilActualData) return;
    document.getElementById("editNombrePerfil").value = window.perfilActualData.nombre;
    
    const av = window.perfilActualData.avatar;
    document.getElementById("editAvatarPerfil").value = av.includes('.') ? av : av + '.jpg';
    document.getElementById("editInfantilPerfil").checked = (Number(window.perfilActualData.infantil) === 1);
    
    document.getElementById("modalEditarPerfil").classList.add("show");
}

async function guardarEdicionPerfilActual() {
    const perfil_id = localStorage.getItem("perfil_id") || sessionStorage.getItem("perfil_id");
    const nombre = document.getElementById("editNombrePerfil").value.trim();
    const avatar = document.getElementById("editAvatarPerfil").value;
    const infantil = document.getElementById("editInfantilPerfil").checked;

    if (!nombre) return mostrarToast("El nombre no puede estar vacío", "error");

    try {
        const res = await fetch(`${API_BASE}/perfiles/${perfil_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, avatar, infantil })
        });
        const datos = await res.json();
        
        if (datos.ok) {
            if (localStorage.getItem("perfil_nombre")) {
                localStorage.setItem("perfil_nombre", nombre);
                localStorage.setItem("perfil_infantil", infantil ? "1" : "0");
            } else {
                sessionStorage.setItem("perfil_nombre", nombre);
                sessionStorage.setItem("perfil_infantil", infantil ? "1" : "0");
            }
            window.location.reload(); 
        } else {
            mostrarToast(datos.mensaje, "error");
        }
    } catch(e) { mostrarToast("Error de conexión", "error"); }
}

async function eliminarPerfilActual() {
    if(!confirm("¿Estás 100% seguro de eliminar ESTE perfil?\nPerderás tu Historial y Mi Lista para siempre.")) return;
    
    const perfil_id = localStorage.getItem("perfil_id") || sessionStorage.getItem("perfil_id");
    try {
        const res = await fetch(`${API_BASE}/perfiles/${perfil_id}`, { method: "DELETE" });
        const datos = await res.json();
        
        if (datos.ok) {
            localStorage.removeItem("perfil_id");
            localStorage.removeItem("perfil_nombre");
            sessionStorage.removeItem("perfil_id");
            sessionStorage.removeItem("perfil_nombre");
            window.location.href = "seleccionar-perfil.html";
        } else {
            mostrarToast(datos.mensaje, "error");
        }
    } catch(e) { mostrarToast("Error al eliminar", "error"); }
}

// ==========================================
// 1. ANIMACIÓN DEL BUSCADOR
// ==========================================
function toggleSearch() {
    const box = document.getElementById("searchBox");
    const input = document.getElementById("searchInputTop");
    if(!box || !input) return;
    
    box.classList.toggle("active");
    if(box.classList.contains("active")) {
        input.focus();
    } else {
        input.value = ""; 
        buscadorInteligente(); 
    }
}

// ==========================================
// 3. RECOMENDACIONES TIPO NETFLIX (Renombrada para no pisar la anterior)
// ==========================================
async function cargarRecomendacionesAlternativas() {
    const perfil_id = localStorage.getItem("perfil_id") || sessionStorage.getItem("perfil_id");
    if (!perfil_id) return;

    try {
        const res = await fetch(`${window.location.origin}/recomendaciones/${perfil_id}`);
        const data = await res.json();

        if (data && data.length > 0) {
            const row = document.getElementById("rowRecomendados");
            const contenedor = document.getElementById("contenedorRecomendados");
            if (row && contenedor) {
                row.style.display = "block";
                // Usamos la lógica original que tenías aquí
                contenedor.innerHTML = data.map(item => `
                    <article class="card">
                        <img src="img/${item.imagen.includes('.') ? item.imagen : item.imagen+'.jpg'}" class="poster" onclick="window.location.href='reproductor.html?id=${item.id}'">
                        <div class="card-info">
                            <h3>${item.titulo}</h3>
                            <p>Porque viste algo similar</p>
                            <div class="card-actions">
                                <button onclick="window.location.href='reproductor.html?id=${item.id}'">▶ Ver</button>
                            </div>
                        </div>
                    </article>
                `).join("");
            }
        }
    } catch(e) {
        console.log("No hay historial suficiente para recomendar aún.");
    }
}

// ==========================================
// INICIALIZACIÓN MÁSTER
// ==========================================
async function inicializarHome() {
    const accesoPermitido = await verificarAccesoCatalogo();
    if (!accesoPermitido) return;

    if (!protegerPerfil()) return;

    const nombrePerfil = localStorage.getItem("perfil_nombre") || sessionStorage.getItem("perfil_nombre") || "StarView";
    const perfilActual = document.getElementById("perfilActual");

    if (perfilActual) {
        perfilActual.innerText = `Perfil actual: ${nombrePerfil}`;
    }

    if (esPerfilInfantilActivo()) {
        mostrarAvisoPerfilInfantil();
    }

    await cargarContinuarViendo();
    await cargarCatalogo();
    await cargarTMDB();
    await cargarRecomendacionesUsuario();
    await cargarDatosTopbar();

    const buscar = document.getElementById("buscar");
    const buscarTop = document.getElementById("searchInputTop");

    if (buscarTop) {
        buscarTop.addEventListener("input", buscadorInteligente);
    }
}

inicializarHome();