const express = require('express');
const router = express.Router();

module.exports = function (pool) {

    // GET config
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM configuracion LIMIT 1');
            if (rows.length === 0) {
                // Insert default config
                await pool.query(`INSERT INTO configuracion (confnombre_empresa, confruc, confdireccion, conftelefono, confiva_porcentaje, confmoneda)
                    VALUES ('Micromercado Muñoz', '0000000000001', 'Dirección del negocio', '0000000000', 15, 'USD')`);
                const [newRows] = await pool.query('SELECT * FROM configuracion LIMIT 1');
                return res.json(newRows[0]);
            }
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT update config
    router.put('/', async (req, res) => {
        try {
            const { confnombre_empresa, confruc, confdireccion, conftelefono, confiva_porcentaje, confmoneda } = req.body;
            await pool.query(
                `UPDATE configuracion SET confnombre_empresa=?, confruc=?, confdireccion=?, conftelefono=?, confiva_porcentaje=?, confmoneda=?`,
                [confnombre_empresa, confruc, confdireccion, conftelefono, confiva_porcentaje, confmoneda]
            );
            res.json({ success: true, message: 'Configuración actualizada' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
