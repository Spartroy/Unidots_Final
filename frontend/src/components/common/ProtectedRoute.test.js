import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

const guarded = (
  <ProtectedRoute allowedRoles={['manager', 'admin']}>
    <div>manager area</div>
  </ProtectedRoute>
);

const renderAt = (path, auth) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<PublicRoute><div>login page</div></PublicRoute>} />
          <Route path="/" element={<div>landing</div>} />
          <Route path="/courier" element={<div>courier home</div>} />
          <Route path="/client" element={<div>client home</div>} />
          <Route path="/manager" element={guarded} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

test('signed-out visitors are sent to login', () => {
  renderAt('/manager', { user: null, isAuthenticated: false, loading: false });
  expect(screen.getByText('login page')).toBeInTheDocument();
});

test('a courier on a manager page lands on the courier portal, not login', () => {
  renderAt('/manager', { user: { role: 'courier' }, isAuthenticated: true, loading: false });
  expect(screen.getByText('courier home')).toBeInTheDocument();
});

test('a manager can open the manager area', () => {
  renderAt('/manager', { user: { role: 'manager' }, isAuthenticated: true, loading: false });
  expect(screen.getByText('manager area')).toBeInTheDocument();
});

test('a signed-in client opening /login goes to their own portal', () => {
  renderAt('/login', { user: { role: 'client' }, isAuthenticated: true, loading: false });
  expect(screen.getByText('client home')).toBeInTheDocument();
});
