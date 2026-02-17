const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =====================================================
// HELPER: Obtener rango de fechas
// =====================================================
const getDateRange = (period) => {
    const today = new Date();
    let startDate = new Date();
    const endDate = new Date(); // Hoy

    // Ajustar fechas según zona horaria local si es necesario (simple)
    // Para simplificar, usamos fechas del servidor (UTC o local del sistema)

    if (period === 'daily') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
        const day = today.getDay(); // 0 (Domingo) - 6 (Sábado)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al Lunes
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
};

// =====================================================
// REPORTE DE VENTAS (Diario, Semanal, Mensual)
// =====================================================
router.get('/ventas/:periodo', async (req, res) => {
    try {
        const { period } = req.params;
        let queryCondition = '';

        // Determinar condición SQL basada en el periodo
        if (req.params.periodo === 'diario') {
            queryCondition = 'DATE(venfecha) = CURDATE()';
        } else if (req.params.periodo === 'semanal') {
            queryCondition = 'YEARWEEK(venfecha, 1) = YEARWEEK(CURDATE(), 1)';
        } else if (req.params.periodo === 'mensual') {
            queryCondition = 'MONTH(venfecha) = MONTH(CURDATE()) AND YEAR(venfecha) = YEAR(CURDATE())';
        } else {
            return res.status(400).json({ error: 'Periodo inválido. Use: diario, semanal, mensual' });
        }

        // Totales generales
        const [totales] = await pool.query(`
            SELECT 
                COUNT(*) as total_transacciones,
                COALESCE(SUM(ventotal), 0) as total_ventas,
                COALESCE(SUM(venmonto_iva), 0) as total_iva
            FROM ventas_encabezado
            WHERE venestado = 'PAGADA' AND ${queryCondition}
        `);

        // Ventas por día (para gráficos, si es semanal o mensual)
        let ventasPorDia = [];
        if (req.params.periodo !== 'diario') {
            const [rows] = await pool.query(`
                SELECT DATE(venfecha) as fecha, SUM(ventotal) as total
                FROM ventas_encabezado
                WHERE venestado = 'PAGADA' AND ${queryCondition}
                GROUP BY DATE(venfecha)
                ORDER BY fecha ASC
            `);
            ventasPorDia = rows;
        }

        res.json({
            periodo: req.params.periodo,
            resumen: totales[0],
            detalle_dias: ventasPorDia
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// TOP PRODUCTOS VENDIDOS (En el periodo actual)
// =====================================================
router.get('/top-productos/:periodo', async (req, res) => {
    try {
        let queryCondition = '';

        if (req.params.periodo === 'diario') {
            queryCondition = 'DATE(v.venfecha) = CURDATE()';
        } else if (req.params.periodo === 'semanal') {
            queryCondition = 'YEARWEEK(v.venfecha, 1) = YEARWEEK(CURDATE(), 1)';
        } else if (req.params.periodo === 'mensual') {
            queryCondition = 'MONTH(v.venfecha) = MONTH(CURDATE()) AND YEAR(v.venfecha) = YEAR(CURDATE())';
        } else {
            // Si no especifica o es 'historico', trae todo
            queryCondition = '1=1';
        }

        const [topProductos] = await pool.query(`
            SELECT p.prodnombre, p.prodcodigo, 
                   SUM(vd.vdetcantidad) as cantidad_vendida,
                   SUM(vd.vdettotal) as total_ingresos
            FROM ventas_detalle vd
            JOIN ventas_encabezado v ON vd.venid = v.venid
            JOIN productos p ON vd.prodid = p.prodid
            WHERE v.venestado = 'PAGADA' AND ${queryCondition}
            GROUP BY p.prodid
            ORDER BY cantidad_vendida DESC
            LIMIT 5
        `);

        res.json(topProductos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
