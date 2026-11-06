import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthContext from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import StatusExplainer from './StatusExplainer';

const renderExplainer = (status) =>
  render(
    <AuthContext.Provider value={{ user: null }}>
      <LanguageProvider>
        <StatusExplainer status={status} />
      </LanguageProvider>
    </AuthContext.Provider>
  );

beforeEach(() => localStorage.clear());

test('explains a known status in plain language', () => {
  renderExplainer('In Prepress');
  expect(screen.getByText('Plates being made')).toBeInTheDocument();
  expect(screen.getByText(/nine steps/)).toBeInTheDocument();
});

test('shows Arabic when the visitor chose Arabic', () => {
  localStorage.setItem('unidots_lang', 'ar');
  renderExplainer('Completed');
  expect(screen.getByText('مكتمل')).toBeInTheDocument();
});

test('renders nothing for an unknown status instead of a raw key', () => {
  const { container } = renderExplainer('Mystery');
  expect(container).toBeEmptyDOMElement();
});
