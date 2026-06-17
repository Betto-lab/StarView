const API_BASE = window.location.origin;

function mostrarMensaje(texto, tipo = "error") {
    const mensaje = document.getElementById("mensaje");

    if (!mensaje) return;

    mensaje.innerText = texto;
    mensaje.style.color = tipo === "ok" ? "#86efac" : "#ffb4b8";
}

function mostrarMensajeRecuperacion(texto, tipo = "error") {
    const mensaje = document.getElementById("mensajeRecuperacion");

    if (!mensaje) return;

    mensaje.innerText = texto;
    mensaje.style.color = tipo === "ok" ? "#86efac" : "#ffb4b8";
}

function abrirRecuperacion() {
    const correoLogin = document.getElementById("correo").value.trim();
    const modal = document.getElementById("modalRecuperacion");

    document.getElementById("correoRecuperar").value = correoLogin;
    document.getElementById("nuevaPassword").value = "";
    document.getElementById("confirmarPassword").value = "";

    mostrarMensajeRecuperacion("");

    modal.classList.add("show");
}

function cerrarRecuperacion() {
    const modal = document.getElementById("modalRecuperacion");

    if (modal) {
        modal.classList.remove("show");
    }
}

async function iniciarSesion() {
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!correo || !password) {
        mostrarMensaje("Completa correo y contraseña");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo,
                password
            })
        });

        const datos = await respuesta.json();

        if (!datos.ok && datos.mensaje !== "Inicio de sesión correcto") {
            mostrarMensaje(datos.mensaje || "Correo o contraseña incorrectos");
            return;
        }

        const usuario = datos.usuario || {};

        const usuarioId =
            usuario.id ||
            usuario.id_usuario ||
            usuario.usuario_id ||
            datos.usuario_id ||
            datos.id_usuario ||
            datos.id;

        if (!usuarioId) {
            mostrarMensaje("Error: no se recibió el ID del usuario desde el servidor");
            console.log("Respuesta del servidor:", datos);
            return;
        }

        localStorage.setItem("usuario_id", usuarioId);
        localStorage.setItem("nombre_usuario", usuario.nombre || usuario.nombre_usuario || "");

        localStorage.removeItem("perfil_id");
        localStorage.removeItem("perfil_nombre");

        mostrarMensaje("Inicio de sesión correcto", "ok");

        const volver = localStorage.getItem("volver_despues_login");

        setTimeout(() => {
            if (volver) {
                localStorage.removeItem("volver_despues_login");
                window.location.href = volver;
            } else {
                window.location.href = "seleccionar-perfil.html";
            }
        }, 500);

    } catch (error) {
        console.log(error);
        mostrarMensaje("No se pudo conectar con el servidor");
    }
}

async function restablecerPassword() {
    const correo = document.getElementById("correoRecuperar").value.trim();
    const password = document.getElementById("nuevaPassword").value.trim();
    const confirmar = document.getElementById("confirmarPassword").value.trim();

    if (!correo || !password || !confirmar) {
        mostrarMensajeRecuperacion("Completa todos los campos");
        return;
    }

    if (password.length < 6) {
        mostrarMensajeRecuperacion("La contraseña debe tener mínimo 6 caracteres");
        return;
    }

    if (password !== confirmar) {
        mostrarMensajeRecuperacion("Las contraseñas no coinciden");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/recuperar-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo,
                password
            })
        });

        const datos = await respuesta.json();

        mostrarMensajeRecuperacion(datos.mensaje, datos.ok ? "ok" : "error");

        if (datos.ok) {
            document.getElementById("correo").value = correo;
            document.getElementById("password").value = "";

            setTimeout(() => {
                cerrarRecuperacion();
                mostrarMensaje("Contraseña actualizada. Ingresa con tu nueva contraseña.", "ok");
            }, 900);
        }

    } catch (error) {
        console.log(error);
        mostrarMensajeRecuperacion("No se pudo conectar con el servidor");
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const modal = document.getElementById("modalRecuperacion");
        const modalAbierto = modal && modal.classList.contains("show");

        if (modalAbierto) {
            restablecerPassword();
        } else {
            iniciarSesion();
        }
    }

    if (event.key === "Escape") {
        cerrarRecuperacion();
    }
});