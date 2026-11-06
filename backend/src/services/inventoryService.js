import StockItem from '../models/stockItemModel.js';
import StockMovement from '../models/stockMovementModel.js';
import User from '../models/userModel.js';
import { createSystemNotification } from '../controllers/notificationController.js';
import { stockUsedForOrder, isLow, describeMaterial } from '../utils/inventoryLogic.js';

export const notifyManagers = async (title, message, link) => {
  const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('_id');
  await Promise.all(managers.map((m) => createSystemNotification(m._id, title, message, 'system', null, 'warning', link)));
};

/**
 * Takes the plate material for an order out of stock, once. Never throws: a stock problem must not stop production.
 * Mutates `order.inventory` and `order.history`; the caller saves the order.
 */
export const deductPlatesForOrder = async (order, userId) => {
  try {
    if (order.inventory?.platesDeducted) return { deducted: false, reason: 'already-deducted' };

    const used = stockUsedForOrder(order);
    if (!used) return { deducted: false, reason: 'no-size' };

    const spec = order.specifications || {};
    const item = await StockItem.findOne({ material: spec.material, thickness: spec.materialThickness, isActive: true });
    if (!item) {
      order.history.push({
        action: 'Stock Not Tracked',
        user: userId,
        details: `No stock item for ${spec.material} ${spec.materialThickness} mm, so no material was deducted.`,
      });
      return { deducted: false, reason: 'no-stock-item' };
    }

    const before = item.quantity;
    item.quantity = Math.round((before - used) * 10000) / 10000;
    await item.save();
    await StockMovement.create({
      item: item._id,
      delta: -used,
      reason: 'order-use',
      order: order._id,
      user: userId,
      note: `Order ${order.orderNumber}`,
      quantityAfter: item.quantity,
    });

    order.inventory = { platesDeducted: true, areaM2: used };
    order.history.push({
      action: 'Stock Deducted',
      user: userId,
      details: `${used} m2 of ${describeMaterial(item)} taken from stock (${item.quantity} m2 left).`,
    });

    // Alert managers when stock first drops to the threshold
    if (isLow(item) && !(before <= item.lowStockThreshold)) {
      await notifyManagers('Low stock', `${describeMaterial(item)} is down to ${item.quantity} m2.`, '/manager/inventory');
    }
    return { deducted: true, used, left: item.quantity };
  } catch (err) {
    console.error('Stock deduction failed:', err.message);
    return { deducted: false, reason: 'error' };
  }
};
