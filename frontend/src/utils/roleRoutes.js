// Single source of truth for where each role lives in the app.
const ROLE_HOME = {
  client: '/client',
  employee: '/employee',
  prepress: '/prepress',
  courier: '/courier',
  manager: '/manager',
  admin: '/manager',
};

export const getHomeForRole = (role) => ROLE_HOME[role] || '/login';

// Returns the path the user asked for if it belongs to their portal, otherwise their portal home.
export const getPostLoginPath = (role, requestedPath) => {
  const home = getHomeForRole(role);
  if (
    requestedPath &&
    home !== '/login' &&
    (requestedPath === home || requestedPath.startsWith(`${home}/`))
  ) {
    return requestedPath;
  }
  return home;
};
