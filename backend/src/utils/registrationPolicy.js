// Public sign-up may only create clients. Every other role must be created by a manager or admin.
export const requiresManagerAuth = (requestedRole) => (requestedRole || 'client') !== 'client';
