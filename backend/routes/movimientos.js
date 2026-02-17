const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// OBTENER TODOS LOS MOVIMIENTOS (Kardex general)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [movimientos] = await pool.query(`
            SELECT k.*, p.prodnombre, p.prodcodigo, u.usuusuario
            FROM kardex k
            JOIN productos p ON k.prodid = p.prodid
            LEFT JOIN usuarios u ON k.usuid = u.usuid
            ORDER BY k.karfecha DESC
            LIMIT 100
        `);
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// KARDEX DE UN PRODUCTO (historial de movimientos)
// =====================================================
router.get('/kardex/:prodid', async (req, res) => {
    try {
        const [producto] = await pool.query(
            'SELECT prodid, prodcodigo, prodnombre, prodstock_global FROM productos WHERE prodid = ?',
            [req.params.prodid]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const [movimientos] = await pool.query(`
            SELECT k.*, u.usuusuario
            FROM kardex k
            LEFT JOIN usuarios u ON k.usuid = u.usuid
            WHERE k.prodid = ?
            ORDER BY k.karfecha ASC
        `, [req.params.prodid]);

        res.json({
            producto: producto[0],
            movimientos,
            saldo_actual: producto[0].prodstock_global
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// AJUSTE DE INVENTARIO (entrada o salida)
// =====================================================
router.post('/ajuste', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { prodid, cantidad_real, observacion } = req.body;
        const usuid = req.body.usuid || 1;

        // Obtener producto actual
        const [producto] = await connection.query(
            'SELECT prodid, prodnombre, prodstock_global FROM productos WHERE prodid = ?',
            [prodid]
        );

        if (producto.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const saldoAnterior = producto[0].prodstock_global;
        const diferencia = cantidad_real - saldoAnterior;

        if (diferencia === 0) {
            await connection.rollback();
            return res.json({ mensaje: 'No hay diferencia, stock ya coincide' });
        }

        const tipo = diferencia > 0 ? 'AJUSTE_ENTRADA' : 'AJUSTE_SALIDA';
        const cantidadAbs = Math.abs(diferencia);

        // Registrar en kardex (el trigger actualiza prodstock_global)
        await connection.query(`
            INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, 
                                karsaldo_actual, karref_documento, karobservacion, usuid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [prodid, tipo, cantidadAbs, saldoAnterior, cantidad_real,
            'AJUSTE', observacion || 'Ajuste de inventario', usuid]);

        await connection.commit();

        res.json({
            mensaje: 'Ajuste realizado exitosamente',
            stock_anterior: saldoAnterior,
            stock_nuevo: cantidad_real,
            diferencia: diferencia
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// =====================================================
// REPORTE DE MOVIMIENTOS POR FECHA Y TIPO
// =====================================================
router.get('/reporte', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, tipo } = req.query;

        let query = `
            SELECT k.*, p.prodnombre, p.prodcodigo
            FROM kardex k
            JOIN productos p ON k.prodid = p.prodid
            WHERE 1=1
        `;
        const params = [];

        if (fecha_inicio) {
            query += ' AND DATE(k.karfecha) >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            query += ' AND DATE(k.karfecha) <= ?';
            params.push(fecha_fin);
        }
        if (tipo) {
            query += ' AND k.kartipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY k.karfecha DESC';

        const [movimientos] = await pool.query(query, params);

        // Calcular totales
        const totales = movimientos.reduce((acc, mov) => {
            if (['COMPRA', 'AJUSTE_ENTRADA', 'DEVOLUCION'].includes(mov.kartipo)) {
                acc.total_entradas += mov.karcantidad;
            } else {
                acc.total_salidas += mov.karcantidad;
            }
            return acc;
        }, { total_entradas: 0, total_salidas: 0 });

        res.json({ movimientos, totales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
