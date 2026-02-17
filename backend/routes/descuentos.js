const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// OBTENER TODOS LOS DESCUENTOS
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [descuentos] = await pool.query(`
            SELECT d.*,
                CASE 
                    WHEN d.descalcance = 'PRODUCTO' THEN p.prodnombre
                    WHEN d.descalcance = 'CATEGORIA' THEN c.catnombre
                END as referencia_nombre
            FROM descuentos d
            LEFT JOIN productos p ON d.descalcance = 'PRODUCTO' AND d.refid = p.prodid
            LEFT JOIN categorias c ON d.descalcance = 'CATEGORIA' AND d.refid = c.catid
            ORDER BY d.descfechafin DESC
        `);
        res.json(descuentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER UN DESCUENTO POR ID
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [descuento] = await pool.query('SELECT * FROM descuentos WHERE descid = ?', [req.params.id]);
        if (descuento.length === 0) {
            return res.status(404).json({ error: 'Descuento no encontrado' });
        }
        res.json(descuento[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// CREAR DESCUENTO
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { descnombre, descalcance, refid, descporcentaje, descfechainicio, descfechafin } = req.body;

        if (!descnombre || !descalcance || !refid || !descporcentaje || !descfechainicio || !descfechafin) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        if (!['PRODUCTO', 'CATEGORIA'].includes(descalcance)) {
            return res.status(400).json({ error: 'Alcance debe ser PRODUCTO o CATEGORIA' });
        }

        const [result] = await pool.query(`
            INSERT INTO descuentos (descnombre, descalcance, refid, descporcentaje, descfechainicio, descfechafin)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [descnombre, descalcance, refid, descporcentaje, descfechainicio, descfechafin]);

        res.status(201).json({
            mensaje: 'Descuento creado exitosamente',
            descid: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ACTUALIZAR DESCUENTO
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { descnombre, descalcance, refid, descporcentaje, descfechainicio, descfechafin, descactivo } = req.body;

        await pool.query(`
            UPDATE descuentos 
            SET descnombre = ?, descalcance = ?, refid = ?, descporcentaje = ?,
                descfechainicio = ?, descfechafin = ?, descactivo = ?
            WHERE descid = ?
        `, [descnombre, descalcance, refid, descporcentaje, descfechainicio, descfechafin, descactivo ?? 1, req.params.id]);

        res.json({ mensaje: 'Descuento actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ELIMINAR (DESACTIVAR) DESCUENTO
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('UPDATE descuentos SET descactivo = 0 WHERE descid = ?', [req.params.id]);
        res.json({ mensaje: 'Descuento desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER DESCUENTOS ACTIVOS PARA UN PRODUCTO
// =====================================================
router.get('/producto/:prodid', async (req, res) => {
    try {
        const [descuentos] = await pool.query(`
            SELECT d.* FROM descuentos d
            JOIN productos p ON p.prodid = ?
            WHERE d.descactivo = 1
              AND CURDATE() BETWEEN d.descfechainicio AND d.descfechafin
              AND (
                  (d.descalcance = 'PRODUCTO' AND d.refid = p.prodid) OR
                  (d.descalcance = 'CATEGORIA' AND d.refid = p.catid)
              )
            ORDER BY d.descporcentaje DESC
        `, [req.params.prodid]);
        res.json(descuentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
