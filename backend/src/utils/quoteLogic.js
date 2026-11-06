// Pure rules for quotes and approvals. Controllers call these, tests cover them.

const CLOSED = ['Completed', 'Delivered', 'Cancelled'];
const WORK_STATUSES = ['Designing', 'Design Done', 'In Prepress'];

// True while a quote that the client must approve is still outstanding.
export const isWorkBlockedByQuote = (order) =>
  Boolean(order?.quote?.required) && order.quote.status !== 'Approved';

// Work statuses that must not start while the quote is outstanding.
export const isBlockedTransition = (order, nextStatus) => isWorkBlockedByQuote(order) && WORK_STATUSES.includes(nextStatus);

export const validateQuoteInput = ({ amount, note, required }, order) => {
  const errors = [];
  const value = Number(amount);
  if (!(value > 0)) errors.push('The quote amount must be greater than 0.');
  if (value > 100000000) errors.push('The quote amount is too large.');
  if (note && String(note).length > 1000) errors.push('The note is too long (1000 characters maximum).');
  if (!order || CLOSED.includes(order.status)) errors.push('This order is closed, so it cannot be quoted.');
  // Requiring approval is only possible before work has started, otherwise a status would be lost.
  if (required && order && !['Submitted', 'Awaiting Approval', 'On Hold'].includes(order.status)) {
    errors.push('Work has already started, so the quote cannot require approval. Send it as an optional quote.');
  }
  return errors;
};

export const validateResponseInput = ({ decision, signedName, reason }, order) => {
  const errors = [];
  if (!order?.quote || order.quote.status !== 'Sent') errors.push('There is no quote waiting for your answer.');
  if (!['approve', 'reject'].includes(decision)) errors.push('Choose approve or reject.');
  if (decision === 'approve' && String(signedName || '').trim().length < 3) {
    errors.push('Type your full name to approve the quote.');
  }
  if (decision === 'reject' && String(reason || '').length > 1000) errors.push('The reason is too long.');
  return errors;
};

// Status the order should have after the client answers.
export const statusAfterResponse = (order, decision) => {
  if (order.status !== 'Awaiting Approval') return order.status;
  return decision === 'approve' ? 'Submitted' : 'On Hold';
};
