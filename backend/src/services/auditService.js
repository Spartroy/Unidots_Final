import AuditLog from '../models/auditLogModel.js';

const clientIp = (req) => String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || req?.ip || undefined;

/**
 * Records one event. Never throws and never blocks the request: if the log cannot be written,
 * the action still goes ahead (the failure is printed to the server log).
 *
 *   recordAudit(req, { action: 'order.status', entityType: 'order', entityId: order._id,
 *                      entityLabel: order.orderNumber, details: 'Designing -> In Prepress' })
 * `actor` overrides req.user (used for sign-in, where there is no session yet).
 */
export const recordAudit = async (req, event) => {
  try {
    const actor = event.actor || req?.user;
    await AuditLog.create({
      actor: actor?._id,
      actorName: actor?.name || event.actorName,
      actorRole: actor?.role || event.actorRole,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ? String(event.entityId) : undefined,
      entityLabel: event.entityLabel,
      details: event.details ? String(event.details).slice(0, 1000) : undefined,
      outcome: event.outcome || 'success',
      ip: clientIp(req),
    });
  } catch (err) {
    console.error('[audit] could not record event:', err.message);
  }
};
