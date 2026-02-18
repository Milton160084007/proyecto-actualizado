const express = require('express');
const router = express.Router();

module.exports = function (pool) {

    // GET audit logs (paginated)
    router.get('/', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const [rows] = await pool.query(
                `SELECT a.*, u.usuusuario
                 FROM auditoria a
                 LEFT JOIN usuarios u ON a.usuid = u.usuid
                 ORDER BY a.audfecha DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            const [countResult] = await pool.query('SELECT COUNT(*) as total FROM auditoria');
            res.json({ data: rows, total: countResult[0].total });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST create log entry (used internally)
    router.post('/', async (req, res) => {
        try {
            const { usuid, audaccion, audtabla, audregistro_id, auddetalle } = req.body;
            await pool.query(
                `INSERT INTO auditoria (usuid, audaccion, audtabla, audregistro_id, auddetalle) VALUES (?,?,?,?,?)`,
                [usuid, audaccion, audtabla, audregistro_id, auddetalle]
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
