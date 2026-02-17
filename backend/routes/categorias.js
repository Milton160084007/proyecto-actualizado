const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// OBTENER TODAS LAS CATEGORÍAS
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [categorias] = await pool.query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM productos WHERE catid = c.catid AND prodactivo = TRUE) AS total_productos
            FROM categorias c
            WHERE c.catactivo = TRUE
            ORDER BY c.catnombre
        `);
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER UNA CATEGORÍA
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [categoria] = await pool.query(
            'SELECT * FROM categorias WHERE catid = ?',
            [req.params.id]
        );
        if (categoria.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json(categoria[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// CREAR CATEGORÍA
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO categorias (catnombre, catdescripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({
            mensaje: 'Categoría creada exitosamente',
            catid: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La categoría ya existe' });
        }
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ACTUALIZAR CATEGORÍA
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        await pool.query(
            'UPDATE categorias SET catnombre = ?, catdescripcion = ? WHERE catid = ?',
            [nombre, descripcion, req.params.id]
        );
        res.json({ mensaje: 'Categoría actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ELIMINAR CATEGORÍA (Soft Delete)
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('UPDATE categorias SET catactivo = FALSE WHERE catid = ?', [req.params.id]);
        res.json({ mensaje: 'Categoría eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
