import { areaM2 } from './pricing.js';

// Pure helpers for plate-material stock.

export const stockUsedForOrder = (order) => Math.round(areaM2(order?.specifications?.dimensions) * 10000) / 10000;

export const isLow = (item) => Number(item.quantity) <= Number(item.lowStockThreshold || 0);

export const describeMaterial = (item) => `${item.material} ${item.thickness} mm`;
