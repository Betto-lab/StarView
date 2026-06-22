const mysql = require("mysql2");

// Si existe la URL de Railway (Vercel), la usa. Si no, usa tu configuración local.
const config = process.env.MYSQL_PUBLIC_URL || {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "starview",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const conexion = mysql.createPool(config);

// PROBAR LA CONEXIÓN INICIAL
conexion.getConnection((error, connection) => {
    if (error) {
        console.error("Error de conexión a la BD:", error.message);
        return;
    }
    console.log("¡Conectado a la Base de Datos con éxito!");
    connection.release(); 
});

module.exports = conexion;