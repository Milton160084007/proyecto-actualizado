require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// IMPORTAR RUTAS
// =====================================================
const categoriasRoutes = require('./routes/categorias');
const proveedoresRoutes = require('./routes/proveedores');
const productosRoutes = require('./routes/productos');
const entradasRoutes = require('./routes/entradas');
const salidasRoutes = require('./routes/salidas');
const usuariosRoutes = require('./routes/usuarios');
const movimientosRoutes = require('./routes/movimientos');
const clientesRoutes = require('./routes/clientes');

// =====================================================
// USAR RUTAS
// =====================================================
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/entradas', entradasRoutes);
app.use('/api/salidas', salidasRoutes);
app.use('/api/ventas', salidasRoutes);   // Alias: /api/ventas también funciona
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/clientes', clientesRoutes);

// =====================================================
// RUTA: Health Check
// =====================================================
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error.message
        });
    }
});

// =====================================================
// RUTA: Dashboard - Resumen General
// =====================================================
app.get('/api/dashboard', async (req, res) => {
    try {
        // Total de productos
        const [totalProductos] = await pool.query(
            'SELECT COUNT(*) as total FROM productos WHERE prodactivo = 1'
        );

        // Valor del inventario
        const [valorInventario] = await pool.query(
            'SELECT COALESCE(SUM(prodstock_global * prodprecio_venta), 0) as valor FROM productos WHERE prodactivo = 1'
        );

        // Productos con stock bajo
        const [stockBajo] = await pool.query(
            'SELECT COUNT(*) as total FROM productos WHERE prodstock_global <= prodminimo AND prodactivo = 1'
        );

        // Lotes próximos a vencer (30 días)
        const [porVencer] = await pool.query(`
            SELECT COUNT(*) as total FROM lotes l
            JOIN productos p ON l.prodid = p.prodid
            WHERE l.lotfecha_vencimiento IS NOT NULL 
              AND l.lotfecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
              AND l.lotfecha_vencimiento >= CURDATE()
              AND l.lotactivo = 1
              AND p.prodactivo = 1
        `);

        // Productos con stock bajo (lista)
        const [stockBajoLista] = await pool.query(`
            SELECT p.prodnombre as nombre, p.prodstock_global as stock_actual 
            FROM productos p 
            WHERE p.prodstock_global <= p.prodminimo AND p.prodactivo = 1
            LIMIT 5
        `);

        // Lotes próximos a vencer (lista)
        const [porVencerLista] = await pool.query(`
            SELECT p.prodnombre as nombre, l.lotfecha_vencimiento as fecha_vencimiento,
                   l.lotcantidad_actual as cantidad
            FROM lotes l
            JOIN productos p ON l.prodid = p.prodid
            WHERE l.lotfecha_vencimiento IS NOT NULL 
              AND l.lotfecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
              AND l.lotfecha_vencimiento >= CURDATE()
              AND l.lotactivo = 1
              AND p.prodactivo = 1
            ORDER BY l.lotfecha_vencimiento ASC
            LIMIT 5
        `);

        // Últimos 5 movimientos (compras)
        const [ultimasCompras] = await pool.query(`
            SELECT k.karid, k.karref_documento as numero, k.karfecha as fecha, 
                   k.karcantidad as cantidad, p.prodnombre
            FROM kardex k
            JOIN productos p ON k.prodid = p.prodid
            WHERE k.kartipo = 'COMPRA'
            ORDER BY k.karfecha DESC LIMIT 5
        `);

        // Últimas 5 ventas
        const [ultimasVentas] = await pool.query(`
            SELECT v.venid, v.vennumero_factura as numero, v.venfecha as fecha, 
                   v.ventotal as total, c.clinombre
            FROM ventas_encabezado v
            JOIN clientes c ON v.cliid = c.cliid
            WHERE v.venestado = 'PAGADA'
            ORDER BY v.venfecha DESC LIMIT 5
        `);

        res.json({
            totalProductos: totalProductos[0].total,
            valorInventario: parseFloat(valorInventario[0].valor) || 0,
            alertasStockBajo: stockBajo[0].total,
            productosProximosVencer: porVencer[0].total,
            stockBajoLista,
            proximosVencerLista: porVencerLista,
            ultimasEntradas: ultimasCompras,
            ultimasSalidas: ultimasVentas
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// RUTA: Kardex de un producto
// =====================================================
app.get('/api/kardex/:prodid', async (req, res) => {
    try {
        const prodid = req.params.prodid;

        // Info del producto
        const [producto] = await pool.query(
            'SELECT prodid, prodcodigo, prodnombre, prodstock_global FROM productos WHERE prodid = ?',
            [prodid]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Movimientos del kardex
        const [movimientos] = await pool.query(`
            SELECT k.karid, k.kartipo as tipo, k.karfecha as fecha, 
                   k.karcantidad as cantidad, k.karsaldo_anterior, k.karsaldo_actual,
                   k.karref_documento as documento, k.karobservacion as observacion,
                   u.usuusuario
            FROM kardex k
            LEFT JOIN usuarios u ON k.usuid = u.usuid
            WHERE k.prodid = ?
            ORDER BY k.karfecha DESC
        `, [prodid]);

        res.json({
            producto: producto[0],
            movimientos
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// RUTA: Roles
// =====================================================
app.get('/api/roles', async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT * FROM roles');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// RUTA: Descuentos activos
// =====================================================
app.get('/api/descuentos', async (req, res) => {
    try {
        const [descuentos] = await pool.query(`
            SELECT d.*
            FROM descuentos d
            WHERE d.descactivo = 1 
              AND CURDATE() BETWEEN d.descfechainicio AND d.descfechafin
        `);
        res.json(descuentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// RUTA: Lotes de un producto
// =====================================================
app.get('/api/lotes/:prodid', async (req, res) => {
    try {
        const [lotes] = await pool.query(`
            SELECT l.*, p.prodnombre, p.prodcodigo
            FROM lotes l
            JOIN productos p ON l.prodid = p.prodid
            WHERE l.prodid = ? AND l.lotactivo = 1
            ORDER BY l.lotfecha_vencimiento ASC
        `, [req.params.prodid]);
        res.json(lotes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║   SISTEMA DE INVENTARIO - MICROMERCADO MUÑOZ      ║
    ║   BD v3 - Kardex Unificado + Facturación          ║
    ║───────────────────────────────────────────────────║
    ║   Servidor corriendo en: http://localhost:${PORT}    ║
    ║   Base de datos: ${process.env.DB_NAME || 'micromercado_munoz'}                  ║
    ╚═══════════════════════════════════════════════════╝
    `);
});
