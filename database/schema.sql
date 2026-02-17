-- --------------------------------------------------------
-- BASE DE DATOS: micromercado_munoz_v3
-- VERSIÓN: DEFINITIVA (Corregida según requerimientos de Ingeniería)
-- --------------------------------------------------------

DROP DATABASE IF EXISTS micromercado_munoz;
CREATE DATABASE micromercado_munoz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE micromercado_munoz;

-- --------------------------------------------------------
-- 1. SEGURIDAD Y ACCESO
-- --------------------------------------------------------

CREATE TABLE roles (
    rolid INT AUTO_INCREMENT PRIMARY KEY,
    rolnombre VARCHAR(50) UNIQUE NOT NULL,
    rolactivo TINYINT(1) DEFAULT 1
);

CREATE TABLE usuarios (
    usuid INT AUTO_INCREMENT PRIMARY KEY,
    rolid INT NOT NULL,
    usuusuario VARCHAR(50) UNIQUE NOT NULL,
    usucontrasena CHAR(64) NOT NULL, -- Almacenará HASH SHA-256 (longitud fija)
    usuactivo TINYINT(1) DEFAULT 1,
    usucreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rolid) REFERENCES roles(rolid)
);

-- --------------------------------------------------------
-- 2. CATÁLOGOS DE PRODUCTOS Y PROVEEDORES
-- --------------------------------------------------------

CREATE TABLE categorias (
    catid INT AUTO_INCREMENT PRIMARY KEY,
    catnombre VARCHAR(100) UNIQUE NOT NULL,
    catdescripcion TEXT,
    catactivo TINYINT(1) DEFAULT 1
);

CREATE TABLE proveedores (
    provid INT AUTO_INCREMENT PRIMARY KEY,
    provnombre VARCHAR(100) NOT NULL,
    provruc VARCHAR(20) UNIQUE,
    provtelefono VARCHAR(20),
    provdireccion TEXT,
    provactivo TINYINT(1) DEFAULT 1
);

CREATE TABLE productos (
    prodid INT AUTO_INCREMENT PRIMARY KEY,
    catid INT NOT NULL,
    prodcodigo VARCHAR(50) UNIQUE NOT NULL,
    prodnombre VARCHAR(150) NOT NULL,
    proddescripcion TEXT,
    prodprecio_venta DECIMAL(10,2) NOT NULL,
    prodtiene_iva TINYINT(1) DEFAULT 1,
    prodstock_global INT DEFAULT 0,
    prodminimo INT DEFAULT 5,
    prodactivo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (catid) REFERENCES categorias(catid)
);

-- Tabla intermedia para que un producto tenga N proveedores
CREATE TABLE producto_proveedores (
    ppid INT AUTO_INCREMENT PRIMARY KEY,
    prodid INT NOT NULL,
    provid INT NOT NULL,
    costo_referencia DECIMAL(10,2) DEFAULT 0.00,
    dias_entrega INT DEFAULT 1,
    FOREIGN KEY (prodid) REFERENCES productos(prodid),
    FOREIGN KEY (provid) REFERENCES proveedores(provid)
);

-- --------------------------------------------------------
-- 3. POLÍTICA DE DESCUENTOS
-- --------------------------------------------------------

CREATE TABLE descuentos (
    descid INT AUTO_INCREMENT PRIMARY KEY,
    descnombre VARCHAR(100) NOT NULL,
    descalcance ENUM('PRODUCTO', 'CATEGORIA') NOT NULL,
    refid INT NOT NULL,
    descporcentaje DECIMAL(5,2) NOT NULL,
    descfechainicio DATE NOT NULL,
    descfechafin DATE NOT NULL,
    descactivo TINYINT(1) DEFAULT 1
);

-- --------------------------------------------------------
-- 4. INVENTARIO (Lógica FIFO y Kardex)
-- --------------------------------------------------------

-- Lotes: Control físico y caducidad
CREATE TABLE lotes (
    lotid INT AUTO_INCREMENT PRIMARY KEY,
    prodid INT NOT NULL,
    lotnro_lote VARCHAR(50),
    lotfecha_vencimiento DATE NOT NULL,
    lotcantidad_inicial INT NOT NULL,
    lotcantidad_actual INT NOT NULL,
    lotcosto_compra DECIMAL(10,2) NOT NULL,
    lotactivo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (prodid) REFERENCES productos(prodid)
);

-- Kardex: Tabla ÚNICA de movimientos
CREATE TABLE kardex (
    karid INT AUTO_INCREMENT PRIMARY KEY,
    prodid INT NOT NULL,
    kartipo ENUM('COMPRA', 'VENTA', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA', 'DEVOLUCION', 'CADUCIDAD') NOT NULL,
    karfecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    karcantidad INT NOT NULL,
    karsaldo_anterior INT NOT NULL,
    karsaldo_actual INT NOT NULL,
    karref_documento VARCHAR(50),
    karobservacion TEXT,
    usuid INT,
    FOREIGN KEY (prodid) REFERENCES productos(prodid),
    FOREIGN KEY (usuid) REFERENCES usuarios(usuid)
);

-- --------------------------------------------------------
-- 5. FACTURACIÓN Y VENTAS
-- --------------------------------------------------------

CREATE TABLE clientes (
    cliid INT AUTO_INCREMENT PRIMARY KEY,
    clinombre VARCHAR(100) NOT NULL,
    clicidruc VARCHAR(20) UNIQUE NOT NULL,
    clidireccion VARCHAR(200),
    clitelefono VARCHAR(20),
    cliemail VARCHAR(100)
);

CREATE TABLE ventas_encabezado (
    venid INT AUTO_INCREMENT PRIMARY KEY,
    usuid INT NOT NULL,
    cliid INT NOT NULL,
    vennumero_factura VARCHAR(20) UNIQUE,
    venfecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    venestado ENUM('PAGADA', 'ANULADA') DEFAULT 'PAGADA',
    vensubtotal DECIMAL(12,2) NOT NULL,
    venbase_imponible DECIMAL(12,2) NOT NULL,
    venbase_cero DECIMAL(12,2) NOT NULL,
    venporcentaje_iva DECIMAL(5,2) DEFAULT 15.00,
    venmonto_iva DECIMAL(12,2) NOT NULL,
    ventotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (usuid) REFERENCES usuarios(usuid),
    FOREIGN KEY (cliid) REFERENCES clientes(cliid)
);

CREATE TABLE ventas_detalle (
    vdetid INT AUTO_INCREMENT PRIMARY KEY,
    venid INT NOT NULL,
    prodid INT NOT NULL,
    lotid INT DEFAULT NULL,
    vdetcantidad INT NOT NULL,
    vdetprecio_unitario DECIMAL(10,2) NOT NULL,
    vdetdescuento DECIMAL(10,2) DEFAULT 0.00,
    vdetsubtotal DECIMAL(12,2) NOT NULL,
    vdetimpuesto DECIMAL(12,2) NOT NULL,
    vdettotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (venid) REFERENCES ventas_encabezado(venid) ON DELETE RESTRICT,
    FOREIGN KEY (prodid) REFERENCES productos(prodid)
);

-- --------------------------------------------------------
-- 6. PROCEDIMIENTOS ALMACENADOS
-- --------------------------------------------------------

DELIMITER $$

-- A. LOGIN SEGURO (SHA2)
CREATE PROCEDURE p_login (IN p_usuario VARCHAR(50), IN p_contrasena VARCHAR(255))
BEGIN
    SELECT usuid, usuusuario, r.rolnombre
    FROM usuarios u
    JOIN roles r ON u.rolid = r.rolid
    WHERE u.usuusuario = p_usuario
      AND u.usucontrasena = SHA2(p_contrasena, 256)
      AND u.usuactivo = 1;
END$$

-- B. INSERTAR USUARIO SEGURO
CREATE PROCEDURE p_crear_usuario (
    IN p_rolid INT,
    IN p_usuario VARCHAR(50),
    IN p_contrasena VARCHAR(255)
)
BEGIN
    INSERT INTO usuarios (rolid, usuusuario, usucontrasena)
    VALUES (p_rolid, p_usuario, SHA2(p_contrasena, 256));
END$$

-- C. TRIGGER PARA MANTENER SINCRONIZADO EL STOCK GLOBAL
CREATE TRIGGER trg_actualizar_stock_global
AFTER INSERT ON kardex
FOR EACH ROW
BEGIN
    IF NEW.kartipo IN ('COMPRA', 'AJUSTE_ENTRADA', 'DEVOLUCION') THEN
        UPDATE productos SET prodstock_global = prodstock_global + NEW.karcantidad
        WHERE prodid = NEW.prodid;
    ELSEIF NEW.kartipo IN ('VENTA', 'AJUSTE_SALIDA', 'CADUCIDAD') THEN
        UPDATE productos SET prodstock_global = prodstock_global - NEW.karcantidad
        WHERE prodid = NEW.prodid;
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------
-- DATOS INICIALES (SEMILLA)
-- --------------------------------------------------------
INSERT INTO roles (rolnombre) VALUES ('Administrador'), ('Cajero'), ('Bodeguero');

-- Contraseña 'admin123' hasheada en SHA256
INSERT INTO usuarios (rolid, usuusuario, usucontrasena) VALUES
(1, 'admin', SHA2('admin123', 256));

INSERT INTO categorias (catnombre) VALUES ('Bebidas'), ('Snacks'), ('Lacteos');

-- Cliente genérico para ventas sin factura
INSERT INTO clientes (clinombre, clicidruc) VALUES ('Consumidor Final', '9999999999999');
