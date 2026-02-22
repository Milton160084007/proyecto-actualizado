const mysql = require('mysql2/promise');
const pool = require('./config/db');

async function run() {
    try {
        const conn = await pool.getConnection();

        await conn.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        confid INT AUTO_INCREMENT PRIMARY KEY,
        confnombre_empresa VARCHAR(150),
        confruc VARCHAR(20),
        confdireccion TEXT,
        conftelefono VARCHAR(20),
        confiva_porcentaje DECIMAL(5,2) DEFAULT 15.00,
        confmoneda VARCHAR(10) DEFAULT 'USD'
      )
    `);

        await conn.query(`
      CREATE TABLE IF NOT EXISTS auditoria (
        audid INT AUTO_INCREMENT PRIMARY KEY,
        usuid INT,
        audaccion VARCHAR(50),
        audtabla VARCHAR(50),
        audregistro_id INT,
        auddetalle TEXT,
        audfecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuid) REFERENCES usuarios(usuid) ON DELETE SET NULL
      )
    `);

        // Create trigger for productos to audit changes
        await conn.query('DROP TRIGGER IF EXISTS trg_audit_productos_update');
        await conn.query(`
      CREATE TRIGGER trg_audit_productos_update
      AFTER UPDATE ON productos
      FOR EACH ROW
      BEGIN
          INSERT INTO auditoria (usuid, audaccion, audtabla, audregistro_id, auddetalle)
          VALUES (1, 'UPDATE', 'productos', NEW.prodid, CONCAT('Precio o detalles actualizados del producto: ', NEW.prodnombre));
      END
    `);

        // Create trigger for ventas
        await conn.query('DROP TRIGGER IF EXISTS trg_audit_ventas_insert');
        await conn.query(`
      CREATE TRIGGER trg_audit_ventas_insert
      AFTER INSERT ON ventas_encabezado
      FOR EACH ROW
      BEGIN
          INSERT INTO auditoria (usuid, audaccion, audtabla, audregistro_id, auddetalle)
          VALUES (NEW.usuid, 'INSERT', 'ventas_encabezado', NEW.venid, CONCAT('Nueva venta registrada: ', NEW.vennumero_factura));
      END
    `);

        // Create trigger for ventas anular
        await conn.query('DROP TRIGGER IF EXISTS trg_audit_ventas_update');
        await conn.query(`
      CREATE TRIGGER trg_audit_ventas_update
      AFTER UPDATE ON ventas_encabezado
      FOR EACH ROW
      BEGIN
          IF NEW.venestado != OLD.venestado THEN
              INSERT INTO auditoria (usuid, audaccion, audtabla, audregistro_id, auddetalle)
              VALUES (NEW.usuid, 'UPDATE', 'ventas_encabezado', NEW.venid, CONCAT('Venta cambió a estado: ', NEW.venestado));
          END IF;
      END
    `);

        console.log('Tablas configuracion y auditoria creadas con triggers.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
