const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// OBTENER TODAS LAS COMPRAS (entradas de inventario)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [compras] = await pool.query(`
            SELECT k.karid, k.prodid, k.karfecha, k.karcantidad, 
                   k.karsaldo_anterior, k.karsaldo_actual,
                   k.karref_documento, k.karobservacion,
                   p.prodnombre, p.prodcodigo, u.usuusuario
            FROM kardex k
            JOIN productos p ON k.prodid = p.prodid
            LEFT JOIN usuarios u ON k.usuid = u.usuid
            WHERE k.kartipo = 'COMPRA'
            ORDER BY k.karfecha DESC
        `);
        res.json(compras);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER UNA COMPRA CON SU LOTE
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [compra] = await pool.query(`
            SELECT k.*, p.prodnombre, p.prodcodigo, u.usuusuario
            FROM kardex k
            JOIN productos p ON k.prodid = p.prodid
            LEFT JOIN usuarios u ON k.usuid = u.usuid
            WHERE k.karid = ? AND k.kartipo = 'COMPRA'
        `, [req.params.id]);

        if (compra.length === 0) {
            return res.status(404).json({ error: 'Compra no encontrada' });
        }
        res.json(compra[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// REGISTRAR COMPRA (Entrada de inventario + Lote + Kardex)
// Recibe: { productos: [{ prodid, cantidad, costo_compra, nro_lote, fecha_vencimiento }], observacion, usuid }
// =====================================================
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { productos, observacion } = req.body;
        const usuid = req.body.usuid || 1;

        // Generar número de documento
        const [countResult] = await connection.query('SELECT COUNT(*) as count FROM kardex WHERE kartipo = "COMPRA"');
        const numDoc = `COMP-${String(countResult[0].count + 1).padStart(6, '0')}`;

        const resultados = [];

        for (const item of productos) {
            // Obtener stock actual del producto
            const [prod] = await connection.query(
                'SELECT prodstock_global FROM productos WHERE prodid = ?',
                [item.prodid]
            );

            if (prod.length === 0) {
                throw new Error(`Producto ${item.prodid} no encontrado`);
            }

            const saldoAnterior = prod[0].prodstock_global;
            const saldoNuevo = saldoAnterior + item.cantidad;

            // 1. Crear lote
            const [loteResult] = await connection.query(`
                INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, 
                                   lotcantidad_inicial, lotcantidad_actual, lotcosto_compra, provid)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [item.prodid, item.nro_lote || null, item.fecha_vencimiento,
            item.cantidad, item.cantidad, item.costo_compra, item.provid || null]);

            // 2. Registrar en kardex (el trigger actualiza prodstock_global)
            await connection.query(`
                INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, 
                                    karsaldo_actual, karref_documento, karobservacion, usuid)
                VALUES (?, 'COMPRA', ?, ?, ?, ?, ?, ?)
            `, [item.prodid, item.cantidad, saldoAnterior, saldoNuevo,
                numDoc, observacion || null, usuid]);

            resultados.push({
                prodid: item.prodid,
                lotid: loteResult.insertId,
                cantidad: item.cantidad,
                costo: item.costo_compra,
                saldo_anterior: saldoAnterior,
                saldo_nuevo: saldoNuevo
            });
        }

        await connection.commit();

        res.status(201).json({
            mensaje: 'Compra registrada exitosamente',
            documento: numDoc,
            items: resultados
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
