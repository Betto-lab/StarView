const API_BASE = window.location.origin;

let perfilPendiente = null;
let perfilRecuperacion = null;

function cerrarSesion() {
    localStorage.clear(); sessionStorage.clear();
    window.location.href = "index.html";
}

function obtenerUsuarioId() {
    const usuario_id = (localStorage.getItem("usuario_id") || sessionStorage.getItem("usuario_id"));

    if (!usuario_id || usuario_id === "undefined" || usuario_id === "null") {
        localStorage.clear(); sessionStorage.clear();
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

function mostrarMensajeRecuperar(texto, tipo = "error") {
    const mensaje = document.getElementById("mensajeRecuperarPerfil");

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

/* =========================
   UTILIDADES DE AVATAR
========================= */

function obtenerRutaAvatar(avatar) {
    if (!avatar) return "img/Red.jpg";

    const texto = String(avatar);

    if (
        texto.includes(".jpg") ||
        texto.includes(".png") ||
        texto.includes(".jpeg") ||
        texto.includes(".webp")
    ) {
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

    if (
        texto.includes(".jpg") ||
        texto.includes(".png") ||
        texto.includes(".jpeg") ||
        texto.includes(".webp")
    ) {
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

/* =========================
   CARGAR PERFILES
========================= */

async function cargarPerfiles() {
    const usuario_id = obtenerUsuarioId();

    if (!usuario_id) return;
    const contenedor = document.getElementById("perfilesContainer");

    if (!contenedor) return;

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/${usuario_id}`);
        const perfiles = await respuesta.json();

        if (!perfiles || perfiles.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    Aún no tienes perfiles.
                    Crea uno para ingresar al catálogo.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = "";
        perfiles.forEach(perfil => {
            const card = document.createElement("article");
            card.className = "perfil-card";

            card.innerHTML = `
                <div class="perfil-avatar" style="overflow: hidden; background: transparent; cursor: pointer;" onclick='abrirModalClavePerfil({"id": ${perfil.id}, "nombre": "${perfil.nombre}", "infantil": ${perfil.infantil}})'>
                    <img 
                        src="${obtenerRutaAvatar(perfil.avatar)}" 
                        alt="${perfil.nombre}" 
                        style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px;"
                    >
                </div>

                <h3 style="cursor: pointer;" onclick='abrirModalClavePerfil({"id": ${perfil.id}, "nombre": "${perfil.nombre}", "infantil": ${perfil.infantil}})'>${perfil.nombre} 🔒</h3>

                ${
                    Number(perfil.infantil) === 1
                        ? `<span class="badge-kids" style="background:#e50914;color:#fff;padding:2px 5px;border-radius:4px;font-size:12px;margin-top:5px;margin-bottom:10px;display:inline-block;">Infantil</span>`
                        : ""
                }

                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 13px;" onclick="prepararEdicion(${perfil.id}, '${perfil.nombre}', '${perfil.avatar}', ${perfil.infantil})">✏️ Editar</button>
                    <button class="btn btn-primary" style="padding: 5px 12px; font-size: 13px; background: #e50914; border: none;" title="Eliminar perfil" onclick="eliminarPerfil(${perfil.id}, '${perfil.nombre}')">🗑️</button>
                </div>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.log("Error al cargar perfiles:", error);
        contenedor.innerHTML = `
            <div class="empty-state">
                No se pudieron cargar los perfiles.
            </div>
        `;
    }
}
/* =========================
   CREAR PERFIL
========================= */

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
        mostrarMensajePerfil("Las contraseñas no coinciden");
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

        mostrarFormularioPerfil();

        await cargarPerfiles();

    } catch (error) {
        console.log(error);
        mostrarMensajePerfil("No se pudo conectar con el servidor");
    }
}

/* =========================
   MODAL INGRESO PERFIL
========================= */

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

    await validarIngresoBackend(
        perfilPendiente.id,
        password,
        perfilPendiente.nombre
    );
}

async function validarIngresoBackend(perfil_id, pin, perfil_nombre) {
    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/verificar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                usuario_id: obtenerUsuarioId(),
                perfil_id: perfil_id, 
                password_perfil: pin 
            })
        });

        const datos = await respuesta.json();

        if (!datos.ok) {
            if (pin !== "") {
                mostrarMensajeClave(datos.mensaje || "Contraseña incorrecta");
            } else {
                alert("Error al acceder al perfil");
            }
            return;
        }

        // Éxito: Guardamos la sesión en el mismo lugar que el usuario
        if (sessionStorage.getItem("usuario_id")) {
            sessionStorage.setItem("perfil_id", datos.perfil.id);
            sessionStorage.setItem("perfil_nombre", datos.perfil.nombre);
            sessionStorage.setItem("perfil_infantil", datos.perfil.infantil || 0);
        } else {
            localStorage.setItem("perfil_id", datos.perfil.id);
            localStorage.setItem("perfil_nombre", datos.perfil.nombre);
            localStorage.setItem("perfil_infantil", datos.perfil.infantil || 0);
        }

        if (pin !== "") {
            mostrarMensajeClave("Perfil verificado correctamente", "ok");
        }

        // ¡AQUÍ ESTÁ LA LÍNEA DE REDIRECCIÓN QUE FALTABA!
        setTimeout(() => {
            window.location.href = "home.html";
        }, pin !== "" ? 500 : 100);

    } catch (error) {
        console.log(error);
        if (pin !== "") mostrarMensajeClave("No se pudo conectar con el servidor");
    }
}

/* =========================
   RECUPERAR CONTRASEÑA DE PERFIL
========================= */

function abrirModalRecuperarPerfil() {
    if (!perfilPendiente) {
        mostrarMensajeClave("Selecciona un perfil primero");
        return;
    }

    perfilRecuperacion = perfilPendiente;

    document.getElementById("modalRecuperarPerfilNombre").innerText = `Recuperar: ${perfilRecuperacion.nombre}`;
    document.getElementById("codigoRecuperarPerfil").value = "";
    document.getElementById("nuevaPasswordPerfil").value = "";
    document.getElementById("confirmarNuevaPasswordPerfil").value = "";

    mostrarMensajeRecuperar("");

    document.getElementById("modalClavePerfil").classList.remove("show");
    document.getElementById("modalRecuperarPerfil").classList.add("show");
}

function cerrarModalRecuperarPerfil() {
    document.getElementById("modalRecuperarPerfil").classList.remove("show");

    if (perfilRecuperacion) {
        perfilPendiente = perfilRecuperacion;
        document.getElementById("modalClavePerfil").classList.add("show");
    }
}

async function enviarCodigoRecuperacionPerfil() {
    const usuario_id = obtenerUsuarioId();

    if (!usuario_id || !perfilRecuperacion) {
        mostrarMensajeRecuperar("No se encontró el perfil seleccionado");
        return;
    }

    const boton = document.getElementById("btnEnviarCodigoPerfil");
    const textoOriginal = boton.innerText;

    boton.innerText = "Enviando código...";
    boton.disabled = true;

    mostrarMensajeRecuperar("Enviando código al correo de la cuenta...", "ok");

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/recuperar-iniciar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id,
                perfil_id: perfilRecuperacion.id
            })
        });

        const datos = await respuesta.json();

        boton.innerText = textoOriginal;
        boton.disabled = false;

        if (!datos.ok) {
            mostrarMensajeRecuperar(datos.mensaje || "No se pudo enviar el código");
            return;
        }

        mostrarMensajeRecuperar("Código enviado. Revisa el correo de la cuenta.", "ok");

    } catch (error) {
        console.log(error);

        boton.innerText = textoOriginal;
        boton.disabled = false;

        mostrarMensajeRecuperar("No se pudo conectar con el servidor");
    }
}

async function restablecerPasswordPerfil() {
    const usuario_id = obtenerUsuarioId();

    if (!usuario_id || !perfilRecuperacion) {
        mostrarMensajeRecuperar("No se encontró el perfil seleccionado");
        return;
    }

    const codigo = document.getElementById("codigoRecuperarPerfil").value.trim();
    const nuevaPassword = document.getElementById("nuevaPasswordPerfil").value.trim();
    const confirmarPassword = document.getElementById("confirmarNuevaPasswordPerfil").value.trim();

    if (!codigo || !nuevaPassword || !confirmarPassword) {
        mostrarMensajeRecuperar("Completa código y nueva contraseña");
        return;
    }

    if (nuevaPassword.length < 4) {
        mostrarMensajeRecuperar("La nueva contraseña debe tener mínimo 4 caracteres");
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        mostrarMensajeRecuperar("Las contraseñas no coinciden");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/recuperar-confirmar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id,
                perfil_id: perfilRecuperacion.id,
                codigo,
                nueva_password: nuevaPassword
            })
        });

        const datos = await respuesta.json();

        if (!datos.ok) {
            mostrarMensajeRecuperar(datos.mensaje || "No se pudo cambiar la contraseña");
            return;
        }

        mostrarMensajeRecuperar("Contraseña actualizada correctamente", "ok");

        setTimeout(() => {
            document.getElementById("modalRecuperarPerfil").classList.remove("show");

            perfilPendiente = perfilRecuperacion;
            perfilRecuperacion = null;

            document.getElementById("passwordIngresoPerfil").value = "";

            mostrarMensajeClave("Ahora ingresa con tu nueva contraseña", "ok");
            document.getElementById("modalClavePerfil").classList.add("show");
        }, 900);

    } catch (error) {
        console.log(error);
        mostrarMensajeRecuperar("No se pudo conectar con el servidor");
    }
}
// ==========================================
// HU03: EDITAR Y ELIMINAR PERFILES
// ==========================================
let perfilEnEdicion = null;

function prepararEdicion(id, nombre, avatar, infantil) {
    perfilEnEdicion = id;
    document.getElementById("nombrePerfil").value = nombre;
    document.getElementById("avatarPerfil").value = avatar;
    document.getElementById("infantilPerfil").checked = (infantil === 1 || infantil === true);
    
    // Ocultar los campos de PIN (la contraseña no se cambia al editar nombre)
    document.getElementById("passwordPerfil").style.display = "none";
    document.getElementById("confirmarPasswordPerfil").style.display = "none";
    document.querySelector("label[for='passwordPerfil']").style.display = "none";
    document.querySelector("label[for='confirmarPasswordPerfil']").style.display = "none";

    // Cambiar la función del botón "Guardar"
    const btnGuardar = document.querySelector("#formPerfil .btn-primary");
    btnGuardar.innerText = "Guardar Cambios";
    btnGuardar.onclick = guardarEdicionPerfil; 

    mostrarFormularioPerfil(); // Abre el panel flotante
}

async function guardarEdicionPerfil() {
    const nombre = document.getElementById("nombrePerfil").value.trim();
    const avatar = document.getElementById("avatarPerfil").value;
    const infantil = document.getElementById("infantilPerfil").checked;

    if (!nombre) return mostrarMensajePerfil("El nombre es obligatorio");

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/${perfilEnEdicion}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, avatar, infantil })
        });
        const datos = await respuesta.json();

        if (datos.ok) {
            mostrarMensajePerfil("Perfil actualizado", "ok");
            mostrarFormularioPerfil(); // Cierra el panel
            cargarPerfiles();
            
            // Volver el formulario a la normalidad en 1 segundo
            setTimeout(restaurarFormularioPerfil, 1000); 
        } else {
            mostrarMensajePerfil(datos.mensaje);
        }
    } catch (error) {
        mostrarMensajePerfil("Error de conexión al editar");
    }
}

function restaurarFormularioPerfil() {
    perfilEnEdicion = null;
    document.getElementById("nombrePerfil").value = "";
    document.getElementById("passwordPerfil").value = "";
    document.getElementById("confirmarPasswordPerfil").value = "";
    document.getElementById("infantilPerfil").checked = false;

    // Mostrar de nuevo los campos de contraseña para cuando se quiera crear uno nuevo
    document.getElementById("passwordPerfil").style.display = "block";
    document.getElementById("confirmarPasswordPerfil").style.display = "block";
    document.querySelector("label[for='passwordPerfil']").style.display = "block";
    document.querySelector("label[for='confirmarPasswordPerfil']").style.display = "block";

    const btnGuardar = document.querySelector("#formPerfil .btn-primary");
    btnGuardar.innerText = "Guardar perfil";
    btnGuardar.onclick = crearPerfil;
}

// Para asegurar que al darle a "+ Agregar perfil" el formulario esté limpio
document.addEventListener("DOMContentLoaded", () => {
    const btnAdd = document.querySelector(".btn-add-profile");
    if(btnAdd) {
        btnAdd.addEventListener("click", restaurarFormularioPerfil);
    }
});

async function eliminarPerfil(id, nombre) {
    // Alerta de seguridad nativa del navegador
    if (!confirm(`¿Estás completamente seguro de eliminar el perfil "${nombre}"?\nSe borrará todo su historial y "Mi Lista". Esta acción no se puede deshacer.`)) return;

    try {
        const respuesta = await fetch(`${API_BASE}/perfiles/${id}`, { method: "DELETE" });
        const datos = await respuesta.json();
        
        if (datos.ok) {
            cargarPerfiles();
        } else {
            alert(datos.mensaje);
        }
    } catch (error) {
        alert("Error al intentar eliminar el perfil");
    }
}
/* =========================
   EVENTOS
========================= */

document.addEventListener("DOMContentLoaded", cargarPerfiles);

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const modalRecuperarAbierto = document.getElementById("modalRecuperarPerfil")?.classList.contains("show");
        const modalClaveAbierto = document.getElementById("modalClavePerfil")?.classList.contains("show");

        if (modalRecuperarAbierto) {
            restablecerPasswordPerfil();
            return;
        }

        if (modalClaveAbierto) {
            validarIngresoPerfil();
        }
    }

    if (event.key === "Escape") {
        const modalRecuperarAbierto = document.getElementById("modalRecuperarPerfil")?.classList.contains("show");

        if (modalRecuperarAbierto) {
            cerrarModalRecuperarPerfil();
        } else {
            cerrarModalClavePerfil();
        }
    }
});