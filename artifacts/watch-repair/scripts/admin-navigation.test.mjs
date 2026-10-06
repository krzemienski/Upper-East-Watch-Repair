import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as wouter from 'wouter';

const primitive = ({ children, className, ...props }) => React.createElement('div', {
  className,
  ...Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-') || key.startsWith('aria-'))),
}, children);
const icons = new Proxy({}, { get: () => () => null });
const ui = new Proxy({}, { get: () => primitive });

async function loadComponent(file, mocks = {}) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return jsx;
      if (name === 'wouter') return wouter;
      if (name === 'lucide-react') return icons;
      if (name.includes('/components/ui/')) return ui;
      if (name.endsWith('/lib/utils')) return { cn: (...classes) => classes.filter(Boolean).join(' ') };
      if (name.endsWith('/PageMeta')) return { PageMeta: () => null };
      if (name.endsWith('/Logo')) return { Logo: () => null };
      if (name === './AdminGate') return { useAdminSession: () => ({ signOut() {}, signingOut: false }) };
      throw new Error(`Unexpected test import: ${name}`);
    },
  });
  return exports;
}

const { AdminShell } = await loadComponent('../src/components/admin/AdminShell.tsx');
function renderAdmin(path, child) {
  return renderToStaticMarkup(React.createElement(wouter.Router, { ssrPath: path },
    React.createElement(wouter.Route, { path: '/admin', nest: true }, child)));
}

test('admin links resolve once under the nested base and mark the current section', () => {
  for (const [path, active] of [
    ['/admin', 'repair-requests'], ['/admin/leads', 'repair-requests'],
    ['/admin/customers', 'customers'], ['/admin/guides', 'guides'],
  ]) {
    const html = renderAdmin(path, React.createElement(AdminShell, { title: 'Test', eyebrow: 'Test' }));
    assert.doesNotMatch(html, /\/admin\/admin/);
    assert.match(html, /href="\/admin\/customers"/);
    assert.match(html, /href="\/admin\/guides"/);
    const anchor = html.match(new RegExp(`<a[^>]*data-testid="nav-admin-${active}"[^>]*>`))[0];
    assert.match(anchor, /aria-current="page"/);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  }
});

test('customer request history links open the intended lead instead of the admin fallback', async () => {
  const customer = {
    key: 'fixture', name: 'Test customer', names: ['Test customer'], phones: [],
    emails: [], requestCount: 1, preferredChannel: 'email', firstRequestAt: '2026-01-01',
    requests: [{ id: 42, watchBrand: 'Test watch', status: 'new', intakeMode: 'online', createdAt: '2026-01-01' }],
  };
  const { default: CustomersPage } = await loadComponent('../src/pages/admin-customers.tsx', {
    '@/components/admin/AdminShell': { AdminShell },
    '@/lib/admin': new Proxy({}, { get: () => (value) => String(value ?? '') }),
    '@workspace/api-client-react': {
      getListCustomersQueryKey: () => ['customers'],
      useListCustomers: () => ({ isSuccess: true, data: [customer] }),
    },
  });
  const html = renderAdmin('/admin/customers', React.createElement(CustomersPage));
  assert.match(html, /href="\/admin\/leads\?lead=42"/);
  assert.doesNotMatch(html, /\/admin\/admin/);
  const target = new URL('/admin/leads?lead=42', 'https://example.test');
  assert.equal(target.searchParams.get('lead'), '42');
  const matched = renderAdmin(target.pathname,
    React.createElement(wouter.Switch, null,
      React.createElement(wouter.Route, { path: '/leads' }, React.createElement('p', null, 'Lead screen')),
      React.createElement(wouter.Route, null, React.createElement('p', null, 'Fallback'))));
  assert.match(matched, /Lead screen/);
  assert.doesNotMatch(matched, /Fallback/);
});
