const API_BASE = window.location.origin;

let perfilPendiente = null;

function cerrarSesion() {
    localStorage.clear();
    window.location.href = "index.html";
}

function obtenerUsuarioId() {
    const usuario_id = localStorage.getItem("usuario_id");

    if (!usuario_id || usuario_id === "undefined" || usuario_id === "null") {
        localStorage.clear();
        window.location.href = "login.html";
        return null;
    }

    return usuario_id;
}

function mostrarMensajePerfil(texto, tipo = "error") {
    const mensaje = document.getElementById("mensajePerfil");

    if (!mensaje) return;

    mensaje.innerText = texto;
    mensaje.style.color = tipo === "ok" ? "#86efac" : "#ffb4b8";
}

function mostrarMensajeClave(texto, tipo = "error") {
    const mensaje = document.getElementById("mensajeClavePerfil");

    if (!mensaje) return;

    mensaje.innerText = texto;
    mensaje.style.color = tipo === "ok" ? "#86efac" : "#ffb4b8";
}

function mostrarFormularioPerfil() {
    const form = document.getElementById("formPerfil");

    if (form) {
        form.classList.toggle("show");
    }
}

function obtenerRutaAvatar(avatar) {
    if (!avatar) return "img/Red.jpg";

    const texto = String(avatar);

    if (texto.includes(".jpg") || texto.includes(".png") || texto.includes(".jpeg") || texto.includes(".webp")) {
        return `img/${texto}`;
    }

    const avatarNormalizado = texto.toLowerCase();

    if (avatarNormalizado.includes("azul")) return "img/Blue.jpg";
    if (avatarNormalizado.includes("verde")) return "img/Green.jpg";
    if (avatarNormalizado.includes("morado")) return "img/Purple.jpg";
    if (avatarNormalizado.includes("dorado")) return "img/Gold.jpg";
    if (avatarNormalizado.includes("rojo")) return "img/Red.jpg";

    return "img/Red.jpg";
}

function obtenerNombreAvatar(avatar) {
    if (!avatar) return "Red.jpg";

    const texto = String(avatar);

    if (texto.includes(".jpg") || texto.includes(".png") || texto.includes(".jpeg") || texto.includes(".webp")) {
        return texto;
    }

    const avatarNormalizado = texto.toLowerCase();

    if (avatarNormalizado.includes("azul")) return "Blue.jpg";
    if (avatarNormalizado.includes("verde")) return "Green.jpg";
    if (avatarNormalizado.includes("morado")) return "Purple.jpg";
    if (avatarNormalizado.includes("dorado")) return "Gold.jpg";
    if (avatarNormalizado.includes("rojo")) return "Red.jpg";

    return "Red.jpg";
}
function inicialPerfil(nombre) {
    return String(nombre || "P").trim().charAt(0).toUpperCase();
}

function seleccionarAvatarPerfil(avatar, boton) {
    document.getElementById("avatarPerfil").value = avatar;

    document.querySelectorAll(".avatar-option").forEach(opcion => {
        opcion.classList.remove("active");
    });

    boton.classList.add("active");
}

async function cargarPerfiles() {
    const usuario_id = obtenerUsuarioId();
    if (!usuario_id) return;

    const contenedor = document.getElementById("perfilesContainer");

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/${usuario_id}`);
        const perfiles = await respuesta.json();

        if (!perfiles || perfiles.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    Aún no tienes perfiles. Crea uno para ingresar al catálogo.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = perfiles.map(perfil => {
            const rutaAvatar = obtenerRutaAvatar(perfil.avatar);
            const nombreAvatar = obtenerNombreAvatar(perfil.avatar);

            return `
                <article class="perfil-card" onclick='abrirModalClavePerfil(${JSON.stringify(perfil)})'>
                    <div class="perfil-avatar-img-box">
                        <img src="${rutaAvatar}" alt="${nombreAvatar}" class="perfil-avatar-img">
                    </div>

                    <h3>${perfil.nombre}</h3>

                    <p>
                        ${perfil.infantil ? "Perfil infantil" : "Perfil general"}
                    </p>

                    <span class="perfil-lock">Protegido con contraseña</span>
                </article>
            `;
        }).join("");

    } catch (error) {
        console.log(error);
        contenedor.innerHTML = `
            <div class="empty-state">
                No se pudieron cargar los perfiles.
            </div>
        `;
    }
}

async function crearPerfil() {
    const usuario_id = obtenerUsuarioId();
    if (!usuario_id) return;

    const nombre = document.getElementById("nombrePerfil").value.trim();
    const avatar = document.getElementById("avatarPerfil").value;
    const password = document.getElementById("passwordPerfil").value.trim();
    const confirmar = document.getElementById("confirmarPasswordPerfil").value.trim();
    const infantil = document.getElementById("infantilPerfil").checked;

    if (!nombre || !avatar || !password || !confirmar) {
        mostrarMensajePerfil("Completa nombre, avatar y contraseña");
        return;
    }

    if (password.length < 4) {
        mostrarMensajePerfil("La contraseña del perfil debe tener mínimo 4 caracteres");
        return;
    }

    if (password !== confirmar) {
        mostrarMensajePerfil("Las contraseñas del perfil no coinciden");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id,
                nombre,
                avatar,
                infantil,
                password_perfil: password
            })
        });

        const datos = await respuesta.json();

        if (!datos.ok) {
            mostrarMensajePerfil(datos.mensaje || "No se pudo crear el perfil");
            return;
        }

        mostrarMensajePerfil("Perfil creado correctamente", "ok");

        document.getElementById("nombrePerfil").value = "";
        document.getElementById("passwordPerfil").value = "";
        document.getElementById("confirmarPasswordPerfil").value = "";
        document.getElementById("infantilPerfil").checked = false;

        await cargarPerfiles();

    } catch (error) {
        console.log(error);
        mostrarMensajePerfil("No se pudo conectar con el servidor");
    }
}

function abrirModalClavePerfil(perfil) {
    perfilPendiente = perfil;

    document.getElementById("modalPerfilNombre").innerText = perfil.nombre;
    document.getElementById("passwordIngresoPerfil").value = "";
    mostrarMensajeClave("");

    document.getElementById("modalClavePerfil").classList.add("show");

    setTimeout(() => {
        document.getElementById("passwordIngresoPerfil").focus();
    }, 100);
}

function cerrarModalClavePerfil() {
    perfilPendiente = null;
    document.getElementById("modalClavePerfil").classList.remove("show");
}

async function validarIngresoPerfil() {
    const usuario_id = obtenerUsuarioId();
    if (!usuario_id || !perfilPendiente) return;

    const password = document.getElementById("passwordIngresoPerfil").value.trim();

    if (!password) {
        mostrarMensajeClave("Ingresa la contraseña del perfil");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/verificar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id,
                perfil_id: perfilPendiente.id,
                password_perfil: password
            })
        });

        const datos = await respuesta.json();

        if (!datos.ok) {
            mostrarMensajeClave(datos.mensaje || "No se pudo ingresar al perfil");
            return;
        }

        localStorage.setItem("perfil_id", perfilPendiente.id);
        localStorage.setItem("perfil_nombre", perfilPendiente.nombre);

        mostrarMensajeClave("Perfil verificado correctamente", "ok");

        setTimeout(() => {
            window.location.href = "home.html";
        }, 500);

    } catch (error) {
        console.log(error);
        mostrarMensajeClave("No se pudo conectar con el servidor");
    }
}

document.addEventListener("DOMContentLoaded", cargarPerfiles);

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const modalAbierto = document.getElementById("modalClavePerfil")?.classList.contains("show");

        if (modalAbierto) {
            validarIngresoPerfil();
        }
    }

    if (event.key === "Escape") {
        cerrarModalClavePerfil();
    }
});