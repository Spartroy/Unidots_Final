// Who may see which orders, and which fields each role gets. Pure functions (no database access).

const idOf = (v) => (v && v._id ? String(v._id) : v ? String(v) : '');

export const isManager = (u) => u?.role === 'manager' || u?.role === 'admin';
export const isPrepress = (u) => u?.role === 'prepress' || u?.department === 'prepress';

// Prepress only needs orders from the moment they reach the plate room.
export const PREPRESS_STATUSES = ['In Prepress', 'Ready for Delivery', 'Delivering', 'Completed'];
// Couriers only need orders that are ready to hand over, on the road, or just delivered.
export const COURIER_STATUSES = ['Ready for Delivery', 'Delivering', 'Completed'];

const assignedToUser = (userId) => [
  { assignedTo: userId },
  { 'stages.review.assignedTo': userId },
  { 'stages.prepress.assignedTo': userId },
  { 'stages.production.assignedTo': userId },
  { 'stages.delivery.assignedTo': userId },
];

/** MongoDB filter that limits a query to the orders this user may see. {} means everything. */
export const visibleOrderFilter = (user) => {
  if (isManager(user)) return {};
  const id = user?._id || user?.id;
  if (user?.role === 'client') return { client: id };
  if (user?.role === 'courier') {
    return { 'stages.delivery.courierInfo.mode': { $exists: true, $ne: null }, status: { $in: COURIER_STATUSES } };
  }
  if (user?.role === 'employee' || user?.role === 'prepress') {
    const rules = [];
    if (user.role === 'employee') rules.push(...assignedToUser(id));
    if (isPrepress(user)) rules.push({ status: { $in: PREPRESS_STATUSES } });
    return rules.length ? { $or: rules } : { _id: null };
  }
  return { _id: null }; // unknown role: nothing
};

/** Same rules for a single order that has already been loaded. */
export const canViewOrder = (user, order) => {
  if (!user || !order) return false;
  if (isManager(user)) return true;
  const id = idOf(user._id || user.id);
  if (user.role === 'client') return idOf(order.client) === id;
  if (user.role === 'courier') {
    return Boolean(order.stages?.delivery?.courierInfo?.mode) && COURIER_STATUSES.includes(order.status);
  }
  if (user.role === 'employee' || user.role === 'prepress') {
    if (isPrepress(user) && PREPRESS_STATUSES.includes(order.status)) return true;
    if (user.role === 'employee') {
      const s = order.stages || {};
      return [order.assignedTo, s.review?.assignedTo, s.prepress?.assignedTo, s.production?.assignedTo, s.delivery?.assignedTo].some(
        (a) => a && idOf(a) === id
      );
    }
  }
  return false;
};

const withoutEmail = (person, keepId) => {
  if (!person || typeof person !== 'object') return person;
  if (keepId && idOf(person) === keepId) return person;
  const { email, ...rest } = person;
  return rest;
};

/**
 * Removes the fields a role should not see. Works on a plain object (call toObject() first).
 * manager/admin: everything. client: no internal job fields or price breakdown, no staff emails.
 * employee/prepress/courier: no prices; prepress and courier also lose client contact details they do not need.
 */
export const redactOrderForUser = (order, user) => {
  if (!order || isManager(user)) return order;
  const out = { ...order, specifications: order.specifications ? { ...order.specifications } : order.specifications };
  const me = idOf(user?._id || user?.id);

  if (user?.role === 'client') {
    delete out.specifications?.jobPath;
    delete out.specifications?.distortion;
    if (out.cost) {
      out.cost = { ...out.cost };
      delete out.cost.breakdown;
    }
    if (Array.isArray(out.history)) out.history = out.history.map((h) => ({ ...h, user: withoutEmail(h.user, me) }));
    if (Array.isArray(out.comments)) out.comments = out.comments.map((c) => ({ ...c, author: withoutEmail(c.author, me) }));
    if (Array.isArray(out.files)) out.files = out.files.map((f) => ({ ...f, uploadedBy: withoutEmail(f.uploadedBy, me) }));
    if (out.assignedTo) out.assignedTo = withoutEmail(out.assignedTo, me);
    return out;
  }

  // Staff other than managers never see prices
  delete out.cost;
  delete out.quote;

  if (user?.role === 'prepress' || (isPrepress(user) && user.role !== 'employee')) {
    if (out.client && typeof out.client === 'object') {
      const { email, phone, address, geoLocation, ...client } = out.client;
      out.client = client;
    }
  }
  if (user?.role === 'courier') {
    delete out.comments;
    delete out.history;
    delete out.designSubmissions;
    delete out.designLinks;
    if (out.client && typeof out.client === 'object') {
      const { email, ...client } = out.client; // name, company, phone and address stay: needed to deliver
      out.client = client;
    }
    delete out.specifications?.jobPath;
    delete out.specifications?.distortion;
  }
  return out;
};
