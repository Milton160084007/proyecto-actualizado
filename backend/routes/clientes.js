const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// OBTENER TODOS LOS CLIENTES
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [clientes] = await pool.query(`
            SELECT * FROM clientes ORDER BY clinombre
        `);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER UN CLIENTE
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cliente] = await pool.query(
            'SELECT * FROM clientes WHERE cliid = ?',
            [req.params.id]
        );
        if (cliente.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(cliente[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// BUSCAR CLIENTE POR CI/RUC
// =====================================================
router.get('/buscar/:cidruc', async (req, res) => {
    try {
        const [cliente] = await pool.query(
            'SELECT * FROM clientes WHERE clicidruc = ?',
            [req.params.cidruc]
        );
        if (cliente.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(cliente[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// CREAR CLIENTE
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { nombre, cidruc, direccion, telefono, email } = req.body;
        const [result] = await pool.query(
            `INSERT INTO clientes (clinombre, clicidruc, clidireccion, clitelefono, cliemail)
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, cidruc, direccion, telefono, email]
        );
        res.status(201).json({
            mensaje: 'Cliente creado exitosamente',
            cliid: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El CI/RUC ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ACTUALIZAR CLIENTE
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { nombre, cidruc, direccion, telefono, email } = req.body;
        await pool.query(
            `UPDATE clientes SET 
             clinombre = ?, clicidruc = ?, clidireccion = ?, clitelefono = ?, cliemail = ?
             WHERE cliid = ?`,
            [nombre, cidruc, direccion, telefono, email, req.params.id]
        );
        res.json({ mensaje: 'Cliente actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ELIMINAR CLIENTE
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM clientes WHERE cliid = ?', [req.params.id]);
        res.json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene ventas asociadas' });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
