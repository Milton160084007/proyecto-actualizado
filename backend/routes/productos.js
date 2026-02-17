const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// OBTENER TODOS LOS PRODUCTOS
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT p.*, 
                   c.catnombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.catid = c.catid
            WHERE p.prodactivo = 1
            ORDER BY p.prodnombre
        `);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER UN PRODUCTO POR ID (con sus proveedores)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [producto] = await pool.query(`
            SELECT p.*, 
                   c.catnombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.catid = c.catid
            WHERE p.prodid = ?
        `, [req.params.id]);

        if (producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Obtener proveedores del producto
        const [proveedores] = await pool.query(`
            SELECT pp.ppid, pp.costo_referencia, pp.dias_entrega,
                   pv.provid, pv.provnombre, pv.provruc
            FROM producto_proveedores pp
            JOIN proveedores pv ON pp.provid = pv.provid
            WHERE pp.prodid = ?
        `, [req.params.id]);

        res.json({ ...producto[0], proveedores });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// BUSCAR PRODUCTOS
// =====================================================
router.get('/buscar/:termino', async (req, res) => {
    try {
        const termino = `%${req.params.termino}%`;
        const [productos] = await pool.query(`
            SELECT p.*, c.catnombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.catid = c.catid
            WHERE p.prodactivo = 1 
              AND (p.prodnombre LIKE ? OR p.prodcodigo LIKE ?)
            ORDER BY p.prodnombre
        `, [termino, termino]);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// PRODUCTOS CON STOCK BAJO
// =====================================================
router.get('/alertas/stock-bajo', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT p.*, c.catnombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.catid = c.catid
            WHERE p.prodstock_global <= p.prodminimo 
              AND p.prodactivo = 1
            ORDER BY p.prodstock_global ASC
        `);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// PRODUCTOS PRÓXIMOS A VENCER (por lotes, 30 días)
// =====================================================
router.get('/alertas/proximos-vencer', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT p.prodid, p.prodcodigo, p.prodnombre, p.prodstock_global,
                   c.catnombre AS categoria_nombre,
                   l.lotid, l.lotnro_lote, l.lotfecha_vencimiento, l.lotcantidad_actual,
                   DATEDIFF(l.lotfecha_vencimiento, CURDATE()) AS dias_restantes
            FROM lotes l
            JOIN productos p ON l.prodid = p.prodid
            LEFT JOIN categorias c ON p.catid = c.catid
            WHERE l.lotfecha_vencimiento IS NOT NULL
              AND l.lotfecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
              AND l.lotfecha_vencimiento >= CURDATE()
              AND l.lotactivo = 1
              AND p.prodactivo = 1
            ORDER BY dias_restantes ASC
        `);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// CREAR PRODUCTO
// =====================================================
router.post('/', async (req, res) => {
    try {
        const {
            catid, codigo, nombre, descripcion,
            precio_venta, tiene_iva, stock_minimo
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO productos 
            (catid, prodcodigo, prodnombre, proddescripcion, 
             prodprecio_venta, prodtiene_iva, prodminimo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [catid, codigo, nombre, descripcion,
            precio_venta, tiene_iva !== undefined ? tiene_iva : 1, stock_minimo || 5]);

        res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            prodid: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El código de producto ya existe' });
        }
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ACTUALIZAR PRODUCTO
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const {
            catid, codigo, nombre, descripcion,
            precio_venta, tiene_iva, stock_minimo
        } = req.body;

        await pool.query(`
            UPDATE productos SET
                catid = ?, prodcodigo = ?, prodnombre = ?, 
                proddescripcion = ?, prodprecio_venta = ?,
                prodtiene_iva = ?, prodminimo = ?
            WHERE prodid = ?
        `, [catid, codigo, nombre, descripcion,
            precio_venta, tiene_iva, stock_minimo, req.params.id]);

        res.json({ mensaje: 'Producto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ELIMINAR PRODUCTO (Soft Delete)
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('UPDATE productos SET prodactivo = 0 WHERE prodid = ?', [req.params.id]);
        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ASIGNAR PROVEEDOR A PRODUCTO
// =====================================================
router.post('/:id/proveedores', async (req, res) => {
    try {
        const { provid, costo_referencia, dias_entrega } = req.body;
        const [result] = await pool.query(`
            INSERT INTO producto_proveedores (prodid, provid, costo_referencia, dias_entrega)
            VALUES (?, ?, ?, ?)
        `, [req.params.id, provid, costo_referencia || 0, dias_entrega || 1]);

        res.status(201).json({
            mensaje: 'Proveedor asignado al producto',
            ppid: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// QUITAR PROVEEDOR DE PRODUCTO
// =====================================================
router.delete('/:id/proveedores/:ppid', async (req, res) => {
    try {
        await pool.query('DELETE FROM producto_proveedores WHERE ppid = ? AND prodid = ?',
            [req.params.ppid, req.params.id]);
        res.json({ mensaje: 'Proveedor desvinculado del producto' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
