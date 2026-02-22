const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { redondear } = require('../utils/calculos');

// =====================================================
// OBTENER TODAS LAS VENTAS
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [ventas] = await pool.query(`
            SELECT v.*, c.clinombre, c.clicidruc, u.usuusuario
            FROM ventas_encabezado v
            JOIN clientes c ON v.cliid = c.cliid
            JOIN usuarios u ON v.usuid = u.usuid
            ORDER BY v.venfecha DESC
        `);
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// OBTENER UNA VENTA CON SUS DETALLES
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [venta] = await pool.query(`
            SELECT v.*, c.clinombre, c.clicidruc, u.usuusuario
            FROM ventas_encabezado v
            JOIN clientes c ON v.cliid = c.cliid
            JOIN usuarios u ON v.usuid = u.usuid
            WHERE v.venid = ?
        `, [req.params.id]);

        if (venta.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const [detalles] = await pool.query(`
            SELECT vd.*, p.prodnombre, p.prodcodigo
            FROM ventas_detalle vd
            JOIN productos p ON vd.prodid = p.prodid
            WHERE vd.venid = ?
        `, [req.params.id]);

        res.json({
            ...venta[0],
            detalles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// CREAR VENTA (Facturación completa + Kardex + FIFO lotes)
// Recibe: { cliid, porcentaje_iva, detalles: [{ prodid, cantidad, descuento? }], usuid? }
// =====================================================
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { cliid, porcentaje_iva = 15, detalles } = req.body;
        const usuid = req.body.usuid || 1;

        // Generar número de factura
        const [countResult] = await connection.query('SELECT COUNT(*) as count FROM ventas_encabezado');
        const numFactura = `FAC-${String(countResult[0].count + 1).padStart(6, '0')}`;

        let baseImponible = 0;
        let baseCero = 0;
        const detallesInsertados = [];

        // Procesar cada línea de detalle
        for (const item of detalles) {
            // Obtener producto
            const [prod] = await connection.query(
                'SELECT prodid, prodnombre, prodprecio_venta, prodstock_global, prodtiene_iva FROM productos WHERE prodid = ? AND prodactivo = 1',
                [item.prodid]
            );

            if (prod.length === 0) {
                throw new Error(`Producto ${item.prodid} no encontrado`);
            }

            const producto = prod[0];

            // Validar stock
            if (producto.prodstock_global < item.cantidad) {
                throw new Error(`Stock insuficiente para ${producto.prodnombre}. Disponible: ${producto.prodstock_global}`);
            }

            const precioUnitario = parseFloat(producto.prodprecio_venta);
            const descUnitario = item.descuento || 0;
            let cantPendiente = item.cantidad;

            // ---- FIFO: descontar de lotes ----
            while (cantPendiente > 0) {
                const [lotes] = await connection.query(`
                    SELECT lotid, lotcantidad_actual FROM lotes 
                    WHERE prodid = ? AND lotcantidad_actual > 0 AND lotactivo = 1
                    ORDER BY lotfecha_vencimiento ASC, lotid ASC
                    LIMIT 1
                `, [item.prodid]);

                let lotidUsado = null;
                let cantDescontada = cantPendiente;

                if (lotes.length > 0) {
                    const lote = lotes[0];
                    lotidUsado = lote.lotid;
                    cantDescontada = Math.min(cantPendiente, lote.lotcantidad_actual);
                    const nuevaCantidad = lote.lotcantidad_actual - cantDescontada;

                    await connection.query(`
                        UPDATE lotes SET lotcantidad_actual = ?, lotactivo = IF(? = 0, 0, 1) 
                        WHERE lotid = ?
                    `, [nuevaCantidad, nuevaCantidad, lote.lotid]);
                }

                const subtotalLinea = redondear(cantDescontada * (precioUnitario - descUnitario));
                let impuestoLinea = 0;
                if (producto.prodtiene_iva) {
                    impuestoLinea = redondear(subtotalLinea * (porcentaje_iva / 100));
                    baseImponible += subtotalLinea;
                } else {
                    baseCero += subtotalLinea;
                }

                const totalLinea = redondear(subtotalLinea + impuestoLinea);

                detallesInsertados.push({
                    prodid: item.prodid,
                    lotid: lotidUsado,
                    prodnombre: producto.prodnombre,
                    cantidad: cantDescontada,
                    precio_unitario: precioUnitario,
                    descuento: descUnitario * cantDescontada,
                    subtotal: subtotalLinea,
                    impuesto: impuestoLinea,
                    total: totalLinea
                });

                cantPendiente -= cantDescontada;
                if (lotes.length === 0) break; // Si ya no hay lotes, la cantidad restante se vendió sin lote
            }

            // ---- Registrar en Kardex (el trigger actualiza prodstock_global) ----
            const saldoAnterior = producto.prodstock_global;
            const saldoNuevo = saldoAnterior - item.cantidad;

            await connection.query(`
                INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, 
                                    karsaldo_actual, karref_documento, karobservacion, usuid)
                VALUES (?, 'VENTA', ?, ?, ?, ?, ?, ?)
            `, [item.prodid, item.cantidad, saldoAnterior, saldoNuevo,
                numFactura, 'Venta', usuid]);
        }

        // Calcular totales de la factura
        const subtotalGeneral = redondear(baseImponible + baseCero);
        const montoIva = redondear(baseImponible * (porcentaje_iva / 100));
        const totalGeneral = redondear(subtotalGeneral + montoIva);

        // Insertar encabezado de venta
        const [ventaResult] = await connection.query(`
            INSERT INTO ventas_encabezado 
            (usuid, cliid, vennumero_factura, vensubtotal, venbase_imponible, venbase_cero,
             venporcentaje_iva, venmonto_iva, ventotal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [usuid, cliid, numFactura, subtotalGeneral, redondear(baseImponible),
            redondear(baseCero), porcentaje_iva, montoIva, totalGeneral]);

        const venid = ventaResult.insertId;

        // Insertar detalles de venta
        for (const det of detallesInsertados) {
            await connection.query(`
                INSERT INTO ventas_detalle 
                (venid, prodid, lotid, vdetcantidad, vdetprecio_unitario, vdetdescuento, 
                 vdetsubtotal, vdetimpuesto, vdettotal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [venid, det.prodid, det.lotid, det.cantidad, det.precio_unitario,
                det.descuento, det.subtotal, det.impuesto, det.total]);
        }

        await connection.commit();

        res.status(201).json({
            mensaje: 'Venta registrada exitosamente',
            venid,
            numero_factura: numFactura,
            subtotal: subtotalGeneral,
            base_imponible: redondear(baseImponible),
            base_cero: redondear(baseCero),
            iva: montoIva,
            total: totalGeneral,
            detalles: detallesInsertados
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// =====================================================
// ANULAR VENTA
// =====================================================
router.put('/:id/anular', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const usuid = req.body.usuid || 1;

        // Verificar que la venta existe y está PAGADA
        const [venta] = await connection.query(
            'SELECT * FROM ventas_encabezado WHERE venid = ? AND venestado = "PAGADA"',
            [req.params.id]
        );

        if (venta.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada o ya anulada' });
        }

        // Obtener detalles para devolver stock
        const [detalles] = await connection.query(
            'SELECT * FROM ventas_detalle WHERE venid = ?',
            [req.params.id]
        );

        // Devolver stock vía kardex
        for (const det of detalles) {
            const [prod] = await connection.query(
                'SELECT prodstock_global FROM productos WHERE prodid = ?',
                [det.prodid]
            );

            const saldoAnterior = prod[0].prodstock_global;
            const saldoNuevo = saldoAnterior + det.vdetcantidad;

            // Restablecer cantidad en el lote
            if (det.lotid) {
                await connection.query(`
                    UPDATE lotes SET lotcantidad_actual = lotcantidad_actual + ?, lotactivo = 1 
                    WHERE lotid = ?
                `, [det.vdetcantidad, det.lotid]);
            }

            await connection.query(`
                INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior,
                                    karsaldo_actual, karref_documento, karobservacion, usuid)
                VALUES (?, 'DEVOLUCION', ?, ?, ?, ?, ?, ?)
            `, [det.prodid, det.vdetcantidad, saldoAnterior, saldoNuevo,
            venta[0].vennumero_factura, 'Anulación de venta', usuid]);
        }

        // Marcar venta como anulada
        await connection.query(
            'UPDATE ventas_encabezado SET venestado = "ANULADA" WHERE venid = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ mensaje: 'Venta anulada exitosamente' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
