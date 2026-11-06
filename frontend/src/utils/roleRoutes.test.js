import { getHomeForRole, getPostLoginPath } from './roleRoutes';

test('every role has its own portal home', () => {
  expect(getHomeForRole('client')).toBe('/client');
  expect(getHomeForRole('employee')).toBe('/employee');
  expect(getHomeForRole('prepress')).toBe('/prepress');
  expect(getHomeForRole('courier')).toBe('/courier');
  expect(getHomeForRole('manager')).toBe('/manager');
  expect(getHomeForRole('admin')).toBe('/manager');
  expect(getHomeForRole('nobody')).toBe('/login');
});

test('login returns to the requested page only inside the user portal', () => {
  expect(getPostLoginPath('client', '/client/orders/42')).toBe('/client/orders/42');
  expect(getPostLoginPath('client', '/manager/orders')).toBe('/client');
  expect(getPostLoginPath('client', '/clientevil')).toBe('/client');
  expect(getPostLoginPath('courier', undefined)).toBe('/courier');
  expect(getPostLoginPath('nobody', '/anything')).toBe('/login');
});
