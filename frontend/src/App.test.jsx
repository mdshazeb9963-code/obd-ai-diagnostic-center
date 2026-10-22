import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('./api.js', () => ({
  http: api,
  errorMessage: (e, fallback = 'Something went wrong.') => e?.message || fallback,
}))
import App from './App.jsx'

function mount(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><App {...props} /></QueryClientProvider>)
}

describe('OBD AI workspace journeys', () => {
  beforeEach(() => {
    sessionStorage.clear()
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.delete.mockReset()
  })
  afterEach(() => cleanup())

  it('switches between sign-in and account creation without losing the form state contract', async () => {
    const user = userEvent.setup()
    mount()
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toBeRequired()
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument()
  })

  it('opens directly into the no-login browser demo and loads a sample report', async () => {
    const user = userEvent.setup()
    let reports = []
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') return Promise.resolve({ data: { id: 'local-demo', displayName: 'Guest demo', role: 'USER' } })
      if (url === '/subscriptions/me') return Promise.resolve({ data: { planCode: 'DEMO', scansUsed: reports.length, scanLimit: -1 } })
      if (url === '/reports') return Promise.resolve({ data: reports })
      if (url === '/vehicles') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    api.post.mockImplementation((url) => {
      if (url === '/demo/sample') {
        reports = [{ id: 'sample-1', fileName: 'sample-scanner-export.txt', vehicleName: 'Example vehicle (sample)', createdAt: '2026-10-22T10:00:00Z', diagnostics: [{ code: 'P0300', severity: 'UNKNOWN' }], healthScore: null }]
        return Promise.resolve({ data: reports[0] })
      }
      return Promise.resolve({ data: {} })
    })
    mount({ demoMode: true })
    expect(await screen.findByRole('heading', { name: 'Check your scanner export.' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('NO-LOGIN BROWSER DEMO')
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' }).querySelectorAll('button')).toHaveLength(4)
    expect(screen.queryByRole('navigation', { name: 'Preferences' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try sample report' }))
    expect(await screen.findByText('sample-scanner-export.txt')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/demo/sample')
  })

  it('shows plain-language causes and next steps for an older saved Toyota scan', async () => {
    const user = userEvent.setup()
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') return Promise.resolve({ data: { id: 'local-demo', displayName: 'Guest demo', role: 'USER' } })
      if (url === '/subscriptions/me') return Promise.resolve({ data: { planCode: 'DEMO', scansUsed: 1, scanLimit: -1 } })
      if (url === '/reports') return Promise.resolve({ data: [{
        id: 'older-toyota-report',
        fileName: 'TOYOTA_old-scan.txt',
        vehicleName: 'Vehicle details not provided',
        createdAt: '2026-10-22T10:00:00Z',
        diagnostics: [{ code: 'C1256', severity: 'UNKNOWN', title: null, description: 'No verified diagnostic provider is connected in this browser demo.', causes: [] }],
      }] })
      if (url === '/vehicles') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    mount({ demoMode: true })

    await user.click(screen.getByRole('button', { name: 'Reports' }))
    await screen.findByRole('heading', { name: 'Diagnostic reports' })
    const reportTable = await screen.findByRole('table')
    await user.click(within(reportTable).getByText('TOYOTA_old-scan.txt').closest('tr'))

    expect(await screen.findByText(/Accumulator low pressure \(Toyota brake system\)/i)).toBeInTheDocument()
    expect(screen.getByText('Possible causes (not confirmed)')).toBeInTheDocument()
    expect(screen.getByText('What to do next')).toBeInTheDocument()
    expect(screen.getByText(/arrange prompt inspection by a qualified Toyota\/brake technician/i)).toBeInTheDocument()
  })

  it('signs in, navigates to upload, validates a file, and saves the resulting report', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({ data: { accessToken: 'test-access', user: { id: 'u1', role: 'USER' } } })
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') return Promise.resolve({ data: { id: 'u1', displayName: 'Test Driver', role: 'USER' } })
      if (url === '/reports') return Promise.resolve({ data: [] })
      if (url === '/vehicles') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    api.post.mockResolvedValueOnce({ data: { id: 'r1', fileName: 'scan.csv', diagnostics: [{ code: 'P0123' }], createdAt: '2026-10-22T10:00:00Z' } })
    mount()
    await user.type(screen.getByLabelText('Email address'), 'driver@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await screen.findByRole('heading', { name: 'Good to have you back.' })
    await user.click(screen.getByRole('button', { name: 'New diagnostic' }))
    expect(await screen.findByRole('heading', { name: 'Upload a scanner export' })).toBeInTheDocument()
    const file = new File(['codes,P0123'], 'scan.csv', { type: 'text/csv' })
    await user.upload(screen.getByLabelText('Scanner export file'), file)
    expect(await screen.findByText('scan.csv')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Analyze file' }))
    expect(await screen.findByRole('heading', { name: 'Your report is ready' })).toBeInTheDocument()
    expect(api.post).toHaveBeenLastCalledWith('/scans/upload', expect.any(FormData), expect.any(Object))
    await user.click(screen.getByRole('button', { name: 'Open report history' }))
    expect(await screen.findByRole('heading', { name: 'Diagnostic reports' })).toBeInTheDocument()
  })

  it('supports multi-click navigation and vehicle creation from the garage', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({ data: { accessToken: 'test-access' } })
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') return Promise.resolve({ data: { id: 'u1', displayName: 'Test Driver', role: 'USER' } })
      if (url === '/vehicles') return Promise.resolve({ data: [] })
      if (url === '/reports') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    api.post.mockResolvedValueOnce({ data: { id: 'v1', nickname: 'Daily', make: 'Honda', model: 'Civic', year: 2020 } })
    mount()
    await user.type(screen.getByLabelText('Email address'), 'driver@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await screen.findByRole('heading', { name: 'Good to have you back.' })
    await user.click(screen.getByRole('button', { name: 'Vehicle garage' }))
    await user.click(await screen.findByRole('button', { name: 'Add your first vehicle' }))
    await user.type(screen.getByLabelText('Nickname'), 'Daily')
    await user.type(screen.getByLabelText('Make'), 'Honda')
    await user.type(screen.getByLabelText('Model'), 'Civic')
    await user.type(screen.getByLabelText('Year'), '2020')
    await user.click(screen.getByRole('button', { name: 'Save vehicle' }))
    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/vehicles', expect.objectContaining({ nickname: 'Daily', make: 'Honda', model: 'Civic', year: 2020 })))
    expect(await screen.findByText('Vehicle added to your garage.')).toBeInTheDocument()
    await user.click(within(screen.getByRole('navigation', { name: 'Preferences' })).getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
  })
})
