-- =========================================================
-- DATOS DE PRUEBA - Micromercado Muñoz v3
-- =========================================================

USE micromercado_munoz;

-- =========================================================
-- USUARIOS ADICIONALES
-- =========================================================
INSERT INTO usuarios (rolid, usuusuario, usucontrasena) VALUES
(2, 'cajero1', SHA2('cajero123', 256)),
(3, 'bodeguero1', SHA2('bodega123', 256));

-- =========================================================
-- CATEGORÍAS ADICIONALES
-- =========================================================
INSERT INTO categorias (catnombre, catdescripcion) VALUES
('Limpieza', 'Productos de limpieza y aseo del hogar'),
('Granos y Cereales', 'Arroz, fideo, avena, lentejas, etc.'),
('Higiene Personal', 'Jabón, shampoo, pasta dental, etc.'),
('Enlatados', 'Conservas y productos enlatados'),
('Panadería', 'Pan, galletas y productos horneados');

-- =========================================================
-- PROVEEDORES
-- =========================================================
INSERT INTO proveedores (provnombre, provruc, provtelefono, provdireccion) VALUES
('Distribuidora Central S.A.', '1790012345001', '022456789', 'Av. 10 de Agosto N45-23, Quito'),
('Pronaca C.A.', '1790008120001', '022998877', 'Km 7.5 Vía Daule, Guayaquil'),
('La Favorita C.A.', '1790040195001', '023456123', 'Av. General Enríquez, Sangolquí'),
('Nestlé Ecuador S.A.', '1790151581001', '022897654', 'Av. González Suárez, Quito'),
('Coca-Cola Ecuador', '1791256115001', '023332211', 'Panamericana Norte Km 4.5, Quito');

-- =========================================================
-- PRODUCTOS (variados, realistas para un micromercado)
-- =========================================================
INSERT INTO productos (catid, prodcodigo, prodnombre, proddescripcion, prodprecio_venta, prodtiene_iva, prodminimo) VALUES
-- Bebidas (catid=1)
(1, 'BEB-001', 'Coca-Cola 500ml', 'Gaseosa Coca-Cola botella personal', 0.85, 1, 10),
(1, 'BEB-002', 'Agua Dasani 500ml', 'Agua pura sin gas', 0.50, 1, 15),
(1, 'BEB-003', 'Jugo del Valle 1L', 'Jugo de naranja natural', 1.50, 1, 8),
(1, 'BEB-004', 'Cerveza Pilsener 600ml', 'Cerveza rubia nacional', 1.75, 1, 12),
(1, 'BEB-005', 'Leche Vita 1L', 'Leche entera pasteurizada', 1.10, 0, 15),

-- Snacks (catid=2)
(2, 'SNK-001', 'Doritos 150g', 'Tortillas de maíz sabor queso', 1.50, 1, 8),
(2, 'SNK-002', 'Papas Ruffles 120g', 'Papas fritas onduladas', 1.25, 1, 10),
(2, 'SNK-003', 'Galletas Oreo 100g', 'Galletas con relleno de crema', 1.00, 1, 12),
(2, 'SNK-004', 'Chitos 80g', 'Palitos de maíz con queso', 0.60, 1, 15),

-- Lácteos (catid=3)
(3, 'LAC-001', 'Yogurt Toni 200ml', 'Yogur de fresa', 0.75, 0, 10),
(3, 'LAC-002', 'Queso Kiosko 500g', 'Queso fresco para mesa', 3.50, 0, 5),
(3, 'LAC-003', 'Mantequilla Bonella 250g', 'Margarina ligera', 1.80, 0, 8),

-- Limpieza (catid=4)
(4, 'LIM-001', 'Cloro Ajax 1L', 'Desinfectante multiusos', 1.20, 1, 10),
(4, 'LIM-002', 'Detergente Deja 1kg', 'Detergente en polvo', 2.50, 1, 8),
(4, 'LIM-003', 'Jabón de Platos Lava 500ml', 'Lavaplatos líquido limón', 1.50, 1, 10),

-- Granos y Cereales (catid=5)
(5, 'GRC-001', 'Arroz Gustadina 1kg', 'Arroz blanco grano largo', 1.10, 0, 20),
(5, 'GRC-002', 'Fideo Don Vittorio 400g', 'Fideo tipo espagueti', 0.95, 0, 15),
(5, 'GRC-003', 'Avena Quaker 500g', 'Avena en hojuelas', 1.60, 0, 10),
(5, 'GRC-004', 'Azúcar Valdez 1kg', 'Azúcar blanca refinada', 1.05, 0, 20),
(5, 'GRC-005', 'Aceite La Favorita 1L', 'Aceite vegetal de palma', 2.80, 0, 10),

-- Higiene Personal (catid=6)
(6, 'HIG-001', 'Jabón Protex 3-pack', 'Jabón antibacterial', 2.40, 1, 8),
(6, 'HIG-002', 'Pasta Colgate 100ml', 'Pasta dental triple acción', 1.90, 1, 10),
(6, 'HIG-003', 'Shampoo H&S 400ml', 'Shampoo anticaspa', 5.50, 1, 5),

-- Enlatados (catid=7)
(7, 'ENL-001', 'Atún Real 180g', 'Atún en aceite vegetal', 1.80, 0, 12),
(7, 'ENL-002', 'Sardina Isabel 425g', 'Sardina en salsa de tomate', 2.20, 0, 8),
(7, 'ENL-003', 'Frejol Van Camp 425g', 'Frejoles en salsa de tomate', 1.30, 0, 10),

-- Panadería (catid=8)
(8, 'PAN-001', 'Pan Bimbo Blanco 500g', 'Pan de molde blanco', 2.50, 0, 8),
(8, 'PAN-002', 'Galletas María 200g', 'Galletas de té clásicas', 0.80, 0, 12);

-- =========================================================
-- RELACIÓN PRODUCTO-PROVEEDOR (M:N)
-- =========================================================
INSERT INTO producto_proveedores (prodid, provid, costo_referencia, dias_entrega) VALUES
(1, 5, 0.45, 2),   -- Coca-Cola ← Coca-Cola Ecuador
(2, 5, 0.25, 2),   -- Dasani ← Coca-Cola Ecuador
(3, 1, 0.85, 3),   -- Jugo ← Distribuidora Central
(4, 1, 1.10, 2),   -- Cerveza ← Distribuidora Central
(5, 2, 0.70, 1),   -- Leche Vita ← Pronaca
(6, 1, 0.90, 3),   -- Doritos ← Distribuidora Central
(7, 1, 0.75, 3),   -- Ruffles ← Distribuidora Central
(8, 4, 0.55, 2),   -- Oreo ← Nestlé
(10, 2, 0.40, 1),  -- Yogurt ← Pronaca
(11, 2, 2.20, 1),  -- Queso ← Pronaca
(13, 1, 0.70, 2),  -- Cloro Ajax ← Distribuidora Central
(14, 1, 1.60, 2),  -- Detergente ← Distribuidora Central
(16, 3, 0.65, 2),  -- Arroz ← La Favorita
(20, 3, 1.80, 2),  -- Aceite ← La Favorita
(23, 2, 1.10, 1),  -- Atún ← Pronaca
(26, 1, 1.50, 3),  -- Pan Bimbo ← Distribuidora Central
(8, 1, 0.60, 4);   -- Oreo ← TAMBIÉN Distribuidora Central (ejemplo M:N)

-- =========================================================
-- CLIENTES ADICIONALES
-- =========================================================
INSERT INTO clientes (clinombre, clicidruc, clidireccion, clitelefono, cliemail) VALUES
('María García López', '1712345678', 'Calle Principal 123, Quito', '0991234567', 'maria.garcia@email.com'),
('Carlos Rodríguez', '1798765432', 'Av. Amazonas N30-12', '0987654321', 'carlos.rod@email.com'),
('Tienda Don Pepe', '1790456789001', 'Mercado Central Local 15', '022334455', 'donpepe@tienda.com'),
('Ana Martínez', '1756781234', 'Barrio San Juan, Cuenca', '0976543210', NULL);

-- =========================================================
-- LOTES Y COMPRAS (Entradas de inventario via Kardex)
-- =========================================================

-- Lote 1: Coca-Cola
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(1, 'CC-2026-001', '2026-08-15', 48, 45, 0.45);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(1, 'COMPRA', 48, 0, 48, 'COMP-000001', 'Compra inicial Coca-Cola', 1);

-- Lote 2: Agua Dasani
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(2, 'DAS-2026-001', '2027-01-20', 60, 58, 0.25);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(2, 'COMPRA', 60, 0, 60, 'COMP-000002', 'Compra inicial Dasani', 1);

-- Lote 3: Jugo del Valle
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(3, 'JDV-2026-001', '2026-06-30', 30, 28, 0.85);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(3, 'COMPRA', 30, 0, 30, 'COMP-000003', 'Compra inicial Jugo', 1);

-- Lote 4: Cerveza Pilsener
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(4, 'PIL-2026-001', '2026-12-31', 24, 20, 1.10);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(4, 'COMPRA', 24, 0, 24, 'COMP-000004', 'Compra inicial Pilsener', 1);

-- Lote 5: Leche Vita
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(5, 'VIT-2026-001', '2026-03-10', 40, 35, 0.70);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(5, 'COMPRA', 40, 0, 40, 'COMP-000005', 'Compra inicial Leche', 1);

-- Lote 6: Doritos
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(6, 'DOR-2026-001', '2026-09-15', 36, 30, 0.90);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(6, 'COMPRA', 36, 0, 36, 'COMP-000006', 'Compra inicial Doritos', 1);

-- Lote 7: Ruffles
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(7, 'RUF-2026-001', '2026-09-20', 30, 25, 0.75);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(7, 'COMPRA', 30, 0, 30, 'COMP-000007', 'Compra inicial Ruffles', 1);

-- Lote 8: Oreo
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(8, 'ORE-2026-001', '2026-11-30', 40, 35, 0.55);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(8, 'COMPRA', 40, 0, 40, 'COMP-000008', 'Compra inicial Oreo', 1);

-- Lote 9: Arroz Gustadina
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(16, 'ARR-2026-001', '2027-06-15', 100, 85, 0.65);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(16, 'COMPRA', 100, 0, 100, 'COMP-000009', 'Compra inicial Arroz', 1);

-- Lote 10: Azúcar
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(19, 'AZU-2026-001', '2027-12-31', 80, 70, 0.65);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(19, 'COMPRA', 80, 0, 80, 'COMP-000010', 'Compra inicial Azúcar', 1);

-- Lote 11: Aceite La Favorita
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(20, 'ACE-2026-001', '2027-03-15', 40, 35, 1.80);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(20, 'COMPRA', 40, 0, 40, 'COMP-000011', 'Compra inicial Aceite', 1);

-- Lote 12: Atún Real
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(23, 'ATU-2026-001', '2028-05-01', 60, 55, 1.10);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(23, 'COMPRA', 60, 0, 60, 'COMP-000012', 'Compra inicial Atún', 1);

-- Lote 13: Yogurt Toni
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(10, 'YOG-2026-001', '2026-03-05', 30, 22, 0.40);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(10, 'COMPRA', 30, 0, 30, 'COMP-000013', 'Compra inicial Yogurt', 1);

-- Lote 14: Cloro Ajax
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(13, 'CLO-2026-001', '2027-10-01', 25, 20, 0.70);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(13, 'COMPRA', 25, 0, 25, 'COMP-000014', 'Compra inicial Cloro', 1);

-- Lote 15: Detergente Deja
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(14, 'DET-2026-001', '2027-08-20', 20, 16, 1.60);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(14, 'COMPRA', 20, 0, 20, 'COMP-000015', 'Compra inicial Detergente', 1);

-- Lote 16: Pan Bimbo
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(26, 'PAN-2026-001', '2026-02-28', 15, 10, 1.50);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(26, 'COMPRA', 15, 0, 15, 'COMP-000016', 'Compra inicial Pan Bimbo', 1);

-- Lote 17: Pasta Colgate
INSERT INTO lotes (prodid, lotnro_lote, lotfecha_vencimiento, lotcantidad_inicial, lotcantidad_actual, lotcosto_compra) VALUES
(22, 'COL-2026-001', '2028-01-15', 24, 20, 1.10);
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(22, 'COMPRA', 24, 0, 24, 'COMP-000017', 'Compra inicial Colgate', 1);

-- =========================================================
-- VENTAS DE EJEMPLO
-- =========================================================

-- Venta 1: María García compra varios productos
INSERT INTO ventas_encabezado (usuid, cliid, vennumero_factura, vensubtotal, venbase_imponible, venbase_cero, venporcentaje_iva, venmonto_iva, ventotal)
VALUES (1, 2, 'FAC-000001', 8.80, 4.10, 4.70, 15.00, 0.62, 9.42);

INSERT INTO ventas_detalle (venid, prodid, vdetcantidad, vdetprecio_unitario, vdetdescuento, vdetsubtotal, vdetimpuesto, vdettotal) VALUES
(1, 1, 3, 0.85, 0, 2.55, 0.38, 2.93),   -- 3 Coca-Cola
(1, 16, 2, 1.10, 0, 2.20, 0.00, 2.20),   -- 2 Arroz
(1, 23, 2, 1.80, 0, 3.60, 0.00, 3.60),   -- 2 Atún
(1, 6, 1, 1.50, 0.05, 1.45, 0.22, 1.67); -- 1 Doritos (descuento $0.05)

-- Kardex de la venta 1
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(1, 'VENTA', 3, 48, 45, 'FAC-000001', 'Venta', 1),
(16, 'VENTA', 2, 100, 98, 'FAC-000001', 'Venta', 1),
(23, 'VENTA', 2, 60, 58, 'FAC-000001', 'Venta', 1),
(6, 'VENTA', 1, 36, 35, 'FAC-000001', 'Venta', 1);

-- Venta 2: Carlos Rodríguez
INSERT INTO ventas_encabezado (usuid, cliid, vennumero_factura, vensubtotal, venbase_imponible, venbase_cero, venporcentaje_iva, venmonto_iva, ventotal)
VALUES (2, 3, 'FAC-000002', 12.15, 5.25, 6.90, 15.00, 0.79, 12.94);

INSERT INTO ventas_detalle (venid, prodid, vdetcantidad, vdetprecio_unitario, vdetdescuento, vdetsubtotal, vdetimpuesto, vdettotal) VALUES
(2, 4, 4, 1.75, 0, 7.00, 1.05, 8.05),    -- 4 Cervezas Pilsener (con IVA)
(2, 5, 5, 0.70, 0, 3.50, 0.00, 3.50),    -- 5 Leches Vita (sin IVA)
(2, 10, 3, 0.75, 0, 2.25, 0.00, 2.25);   -- 3 Yogurt (sin IVA)

INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(4, 'VENTA', 4, 24, 20, 'FAC-000002', 'Venta', 2),
(5, 'VENTA', 5, 40, 35, 'FAC-000002', 'Venta', 2),
(10, 'VENTA', 3, 30, 27, 'FAC-000002', 'Venta', 2);

-- Venta 3: Consumidor Final (venta rápida)
INSERT INTO ventas_encabezado (usuid, cliid, vennumero_factura, vensubtotal, venbase_imponible, venbase_cero, venporcentaje_iva, venmonto_iva, ventotal)
VALUES (1, 1, 'FAC-000003', 5.65, 3.70, 1.95, 15.00, 0.56, 6.21);

INSERT INTO ventas_detalle (venid, prodid, vdetcantidad, vdetprecio_unitario, vdetdescuento, vdetsubtotal, vdetimpuesto, vdettotal) VALUES
(3, 2, 2, 0.50, 0, 1.00, 0.15, 1.15),    -- 2 Agua Dasani
(3, 7, 2, 1.25, 0, 2.50, 0.38, 2.88),    -- 2 Ruffles
(3, 17, 1, 0.95, 0, 0.95, 0.00, 0.95),   -- 1 Fideo
(3, 19, 1, 1.05, 0, 1.05, 0.00, 1.05);   -- 1 Azúcar

INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(2, 'VENTA', 2, 60, 58, 'FAC-000003', 'Venta', 1),
(7, 'VENTA', 2, 30, 28, 'FAC-000003', 'Venta', 1);

-- =========================================================
-- AJUSTES DE INVENTARIO
-- =========================================================
INSERT INTO kardex (prodid, kartipo, karcantidad, karsaldo_anterior, karsaldo_actual, karref_documento, karobservacion, usuid) VALUES
(10, 'AJUSTE_SALIDA', 5, 27, 22, 'AJUSTE', 'Yogurt dañado por refrigeración', 1),
(13, 'AJUSTE_SALIDA', 5, 25, 20, 'AJUSTE', 'Cloro con envase roto', 3),
(14, 'AJUSTE_SALIDA', 4, 20, 16, 'AJUSTE', 'Detergente húmedo en bodega', 3),
(26, 'AJUSTE_SALIDA', 5, 15, 10, 'AJUSTE', 'Pan vencido descartado', 1);

-- =========================================================
-- DESCUENTOS ACTIVOS
-- =========================================================
INSERT INTO descuentos (descnombre, descalcance, refid, descporcentaje, descfechainicio, descfechafin) VALUES
('Promo Bebidas Verano', 'CATEGORIA', 1, 10.00, '2026-02-01', '2026-03-31'),
('Descuento Doritos', 'PRODUCTO', 6, 5.00, '2026-02-10', '2026-02-28'),
('Oferta Limpieza', 'CATEGORIA', 4, 15.00, '2026-02-15', '2026-03-15');

SELECT 'Datos de prueba insertados exitosamente!' AS resultado;
