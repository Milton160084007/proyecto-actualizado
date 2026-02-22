const express = require('express');
const router = express.Router();

module.exports = function (pool) {

    // GET all devoluciones
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT d.*, v.vennumero_factura as vennumero, c.clinombre
                 FROM devoluciones d
                 LEFT JOIN ventas_encabezado v ON d.venid = v.venid
                 LEFT JOIN clientes c ON v.cliid = c.cliid
                 ORDER BY d.devfecha DESC`
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST create devolucion
    router.post('/', async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const { venid, usuid, motivo, detalles } = req.body;
            // detalles = [{ prodid, cantidad }]

            let totalDevuelto = 0;

            for (const item of detalles) {
                // Get original price
                const [detVenta] = await conn.query(
                    `SELECT dv.vdetprecio_unitario FROM ventas_detalle dv WHERE dv.venid=? AND dv.prodid=? LIMIT 1`,
                    [venid, item.prodid]
                );
                const precioUnit = detVenta.length > 0 ? parseFloat(detVenta[0].vdetprecio_unitario) : 0;
                totalDevuelto += precioUnit * item.cantidad;

                // Return stock
                await conn.query('UPDATE productos SET prodstock_global = prodstock_global + ? WHERE prodid = ?', [item.cantidad, item.prodid]);

                // Register kardex
                const [prodRow] = await conn.query('SELECT prodstock_global FROM productos WHERE prodid=?', [item.prodid]);
                const saldoActual = prodRow[0].prodstock_global;
                await conn.query(
                    `INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion)
                     VALUES (?, 'DEVOLUCION', ?, ?, ?, ?, ?)`,
                    [item.prodid, item.cantidad, saldoActual - item.cantidad, saldoActual, `DEV-${venid}`, motivo]
                );
            }

            // Register devolucion record
            const [result] = await conn.query(
                `INSERT INTO devoluciones (venid, usuid, devmotivo, devtotal, devestado) VALUES (?,?,?,?, 'PROCESADA')`,
                [venid, usuid, motivo, totalDevuelto]
            );

            await conn.commit();
            res.json({ success: true, devid: result.insertId, total: totalDevuelto });
        } catch (err) {
            await conn.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            conn.release();
        }
    });

    // Global search
    router.get('/busqueda', async (req, res) => {
        try {
            const q = `%${req.query.q || ''}%`;
            const [productos] = await pool.query(
                `SELECT prodid, prodnombre, prodcodigo, 'producto' as tipo FROM productos WHERE prodnombre LIKE ? OR prodcodigo LIKE ? LIMIT 5`, [q, q]
            );
            const [clientes] = await pool.query(
                `SELECT cliid, clinombre, clicidruc, 'cliente' as tipo FROM clientes WHERE clinombre LIKE ? OR clicidruc LIKE ? LIMIT 5`, [q, q]
            );
            const [ventas] = await pool.query(
                `SELECT venid, vennumero_factura as vennumero, ventotal, 'venta' as tipo FROM ventas_encabezado WHERE vennumero_factura LIKE ? LIMIT 5`, [q]
            );
            res.json({ productos, clientes, ventas });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
