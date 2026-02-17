/**
 * Utilidades de cálculo para el sistema de inventario
 * Micromercado Muñoz - v3
 */

// =====================================================
// IVA - Ahora dinámico (porcentaje configurable por venta)
// =====================================================

/**
 * Calcula el IVA de un monto
 * @param {number} monto - Monto base
 * @param {number} porcentaje - Porcentaje de IVA (default 15)
 * @returns {number} Monto del IVA
 */
function calcularIVA(monto, porcentaje = 15) {
    return redondear(monto * (porcentaje / 100));
}

/**
 * Calcula el subtotal + IVA
 * @param {number} monto - Monto base
 * @param {number} porcentaje - Porcentaje de IVA (default 15)
 * @returns {{ subtotal: number, iva: number, total: number }}
 */
function calcularConIVA(monto, porcentaje = 15) {
    const subtotal = redondear(monto);
    const iva = calcularIVA(monto, porcentaje);
    const total = redondear(subtotal + iva);
    return { subtotal, iva, total };
}

// =====================================================
// REDONDEO
// =====================================================

/**
 * Redondea a 2 decimales
 * @param {number} valor
 * @returns {number}
 */
function redondear(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}

// =====================================================
// VALORACIÓN DE INVENTARIO (para reportes)
// =====================================================

/**
 * Valoración FIFO (Primero en Entrar, Primero en Salir)
 * @param {Array} lotes - Array de lotes [{ cantidad, costo }]
 * @param {number} cantidadSalida
 * @returns {{ costo_total: number, costo_promedio: number, lotes_consumidos: Array }}
 */
function valoracionFIFO(lotes, cantidadSalida) {
    let restante = cantidadSalida;
    let costoTotal = 0;
    const consumidos = [];

    // Ordenar por fecha más antigua (FIFO)
    const lotesOrdenados = [...lotes].sort((a, b) =>
        new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime()
    );

    for (const lote of lotesOrdenados) {
        if (restante <= 0) break;

        const usar = Math.min(restante, lote.cantidad);
        costoTotal += usar * (lote.costo || 0);
        restante -= usar;

        consumidos.push({
            lotid: lote.lotid,
            cantidad_usada: usar,
            costo_unitario: lote.costo || 0
        });
    }

    return {
        costo_total: redondear(costoTotal),
        costo_promedio: cantidadSalida > 0 ? redondear(costoTotal / cantidadSalida) : 0,
        lotes_consumidos: consumidos
    };
}

/**
 * Valoración LIFO (Último en Entrar, Primero en Salir)
 * @param {Array} lotes - Array de lotes [{ cantidad, costo }]
 * @param {number} cantidadSalida
 * @returns {{ costo_total: number, costo_promedio: number }}
 */
function valoracionLIFO(lotes, cantidadSalida) {
    let restante = cantidadSalida;
    let costoTotal = 0;

    // Ordenar por fecha más reciente (LIFO)
    const lotesOrdenados = [...lotes].sort((a, b) =>
        new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
    );

    for (const lote of lotesOrdenados) {
        if (restante <= 0) break;

        const usar = Math.min(restante, lote.cantidad);
        costoTotal += usar * (lote.costo || 0);
        restante -= usar;
    }

    return {
        costo_total: redondear(costoTotal),
        costo_promedio: cantidadSalida > 0 ? redondear(costoTotal / cantidadSalida) : 0
    };
}

/**
 * Valoración por Promedio Ponderado
 * @param {Array} lotes - Array de lotes [{ cantidad, costo }]
 * @returns {{ costo_promedio: number, total_unidades: number, valor_total: number }}
 */
function valoracionPromedio(lotes) {
    let totalUnidades = 0;
    let valorTotal = 0;

    for (const lote of lotes) {
        totalUnidades += lote.cantidad;
        valorTotal += lote.cantidad * (lote.costo || 0);
    }

    return {
        costo_promedio: totalUnidades > 0 ? redondear(valorTotal / totalUnidades) : 0,
        total_unidades: totalUnidades,
        valor_total: redondear(valorTotal)
    };
}

module.exports = {
    calcularIVA,
    calcularConIVA,
    redondear,
    valoracionFIFO,
    valoracionLIFO,
    valoracionPromedio
};
