const mysql = require("mysql2");

const conexion = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    user: process.env.DB_USER || process.env.MYSQLUSER || "user",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "agilemortal",
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || "starview",
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306
});

conexion.connect((error) => {
    if (error) {
        console.error("Error de conexión a MariaDB/MySQL:", error.message);
        return;
    }

    console.log("Conectado a MariaDB/MySQL");
});

module.exports = conexion;