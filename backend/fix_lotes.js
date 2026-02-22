const mysql = require('mysql2/promise');
const pool = require('./config/db');

async function run() {
    try {
        const conn = await pool.getConnection();

        await conn.query(`
      ALTER TABLE lotes
      ADD COLUMN provid INT DEFAULT NULL,
      ADD CONSTRAINT fk_lotes_proveedor FOREIGN KEY (provid) REFERENCES proveedores(provid) ON DELETE SET NULL
    `);

        console.log('ALTER TABLE exitoso');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
