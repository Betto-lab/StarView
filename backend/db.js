const mysql = require("mysql2");

const conexion = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "agilemortal",
    database: process.env.DB_NAME || "starview",
    port: process.env.DB_PORT || 3306
});

conexion.connect((error) => {
    if (error) {
        console.error("Error de conexión a MariaDB/MySQL:", error.message);
        return;
    }

    console.log("Conectado a MariaDB/MySQL");
});

module.exports = conexion;