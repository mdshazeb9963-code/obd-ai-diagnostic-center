import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, ArrowRight, Bell, BookOpen, CarFront, Check,
  ChevronDown, CircleHelp, Clock3, CloudUpload, Download, FileClock, FileText, Gauge,
  LayoutDashboard, LockKeyhole, LogOut, Menu, MessageCircle, Search, Settings, Shield,
  Sparkles, Trash2, TriangleAlert, Upload, Wrench, X, Zap,
} from 'lucide-react'
import { errorMessage, http } from './api.js'

const navItems = [
  { id: 'home', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'New diagnostic', icon: CloudUpload },
  { id: 'garage', label: 'Vehicle garage', icon: CarFront },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'history', label: 'Scan history', icon: FileClock },
  { id: 'assistant', label: 'AI mechanic', icon: Sparkles },
]

const cx = (...parts) => parts.filter(Boolean).join(' ')
const staticPreview = import.meta.env.VITE_STATIC_PREVIEW === 'true'

function App({ demoMode = staticPreview } = {}) {
  const [token, setToken] = useState(() => demoMode ? 'local-demo' : sessionStorage.getItem('obd.accessToken'))
  const [page, setPage] = useState('home')
  const [mobileNav, setMobileNav] = useState(false)
  const [notice, setNotice] = useState('')
  const queryClient = useQueryClient()
  const accountQuery = useQuery({ queryKey: ['me'], queryFn: async () => (await http.get('/auth/me')).data, enabled: Boolean(token) })
  const subscriptionQuery = useQuery({ queryKey: ['subscription'], queryFn: async () => (await http.get('/subscriptions/me')).data, enabled: Boolean(token) })

  useEffect(() => {
    const expire = () => setToken(null)
    window.addEventListener('obd:session-expired', expire)
    return () => window.removeEventListener('obd:session-expired', expire)
  }, [])

  const onAuthenticated = (accessToken) => {
    sessionStorage.setItem('obd.accessToken', accessToken)
    setToken(accessToken)
  }
  const logout = async () => {
    try { await http.post('/auth/logout') } catch { /* local session still ends */ }
    sessionStorage.removeItem('obd.accessToken')
    queryClient.clear()
    setToken(null)
  }

  if (!token) return <AuthScreen onAuthenticated={onAuthenticated} />
  return (
    <div className="app-shell">
      <Sidebar active={page} onChange={(id) => { setPage(id); setMobileNav(false) }} onLogout={logout} mobile={mobileNav} user={accountQuery.data} subscription={subscriptionQuery.data} demoMode={demoMode} />
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <main className="main-shell">
      <Topbar onMenu={() => setMobileNav(true)} onNavigate={setPage} demoMode={demoMode} />
        {demoMode && <div className="demo-banner" role="status"><strong>NO-LOGIN BROWSER DEMO</strong><span>Changes stay in this browser. Codes are extracted from uploaded text; diagnostic details are unverified without a provider.</span></div>}
        <div className="page-wrap">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {page === 'home' && <Overview onNavigate={setPage} demoMode={demoMode} />}
              {page === 'upload' && <UploadPage demoMode={demoMode} onSaved={() => { setNotice('Diagnostic report saved to your history.'); queryClient.invalidateQueries({ queryKey: ['reports'] }); setPage('reports') }} />}
              {page === 'garage' && <Garage />}
              {page === 'reports' && <Reports demoMode={demoMode} />}
              {page === 'history' && <Reports history demoMode={demoMode} />}
              {page === 'assistant' && <Assistant demoMode={demoMode} />}
              {page === 'notifications' && <Notifications />}
              {page === 'settings' && <SettingsPage demoMode={demoMode} />}
              {page === 'admin' && <AdminPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [formError, setFormError] = useState('')
  const mutation = useMutation({
    mutationFn: async (body) => (await http.post('/auth/' + (mode === 'login' ? 'login' : 'register'), body)).data,
    onSuccess: (data) => onAuthenticated(data.accessToken),
    onError: (e) => setFormError(errorMessage(e, 'Unable to authenticate.')),
  })
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Brand />
        <div className="auth-art">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-crosshair">OBD <span>II</span></div>
          <div className="art-signal signal-a"><span /><span /><span /><span /><span /></div>
          <div className="art-signal signal-b"><span /><span /><span /><span /></div>
          <div className="art-code">P 0 3 0 0</div>
          <div className="art-label">LIVE SYSTEM ANALYSIS <b>● CONNECTED</b></div>
        </div>
        <div className="auth-caption"><span className="eyebrow">BUILT FOR THE DRIVE</span><h1>Know what your<br /><em>engine is saying.</em></h1><p>Turn scanner data into clear, evidence-based next steps for every vehicle you care for.</p></div>
        <div className="auth-bottom"><span>INTELLIGENCE FOR EVERY MILE</span><span>OBD AI DIAGNOSTIC CENTER</span></div>
      </div>
      <section className="auth-form-wrap">
        <div className="auth-form-inner">
          <span className="eyebrow mobile-brand">OBD AI DIAGNOSTIC CENTER</span>
          <div className="auth-kicker"><Shield size={15} /> SECURE DIAGNOSTIC WORKSPACE</div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to continue to your garage.' : 'Start building a clearer picture of your vehicles.'}</p>
          {staticPreview && <div className="preview-notice" role="status"><strong>Live frontend preview</strong><span>GitHub Pages hosts the interface. Sign-in, scans, saved reports, and AI need the API and data services to be deployed separately.</span><a href="https://github.com/mdshazeb9963-code/obd-ai-diagnostic-center#start-the-full-stack">Setup instructions</a></div>}
          <form onSubmit={(event) => { event.preventDefault(); setFormError(''); const fd = new FormData(event.currentTarget); mutation.mutate({ email: fd.get('email'), password: fd.get('password'), displayName: fd.get('name') }) }}>
            {mode === 'register' && <label className="field-label">Your name<input name="name" autoComplete="name" placeholder="Alex Morgan" required minLength="2" /></label>}
            <label className="field-label">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label className="field-label">Password<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 10 characters" minLength="10" required /></label>
            {formError && <div className="form-error"><TriangleAlert size={16} />{formError}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={staticPreview || mutation.isPending}>{staticPreview ? <>API not connected <ArrowRight size={17} /></> : mutation.isPending ? <span className="spinner" /> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></>}</button>
          </form>
          <div className="auth-switch">{mode === 'login' ? 'New to the garage?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setFormError('') }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></div>
          <div className="auth-security"><LockKeyhole size={14} /> Your diagnostic records are private and encrypted in transit.</div>
          <p className="auth-legal">By continuing, you agree to use diagnostic guidance as informational support. Always verify safety-critical repairs with a qualified technician.</p>
        </div>
      </section>
    </div>
  )
}

function Brand() {
  return <div className="brand"><div className="brand-mark"><Activity size={19} strokeWidth={2.4} /></div><div><strong>OBD<span>AI</span></strong><small>DIAGNOSTIC CENTER</small></div></div>
}

function Sidebar({ active, onChange, onLogout, mobile, user, subscription, demoMode = false }) {
  const visibleItems = demoMode ? navItems.filter(({ id }) => ['home', 'upload', 'garage', 'reports'].includes(id)) : navItems
  return <aside className={cx('sidebar', mobile && 'sidebar-open')}>
    <div className="sidebar-top"><Brand /><button className="sidebar-close icon-button" aria-label="Close navigation" onClick={() => onChange(active)}><X size={18} /></button></div>
    <div className="workspace-label">WORKSPACE <span>● {demoMode ? 'DEMO' : 'PERSONAL'}</span></div>
    <nav aria-label="Main navigation">
      {visibleItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={cx('nav-item', active === id && 'nav-active')} aria-current={active === id ? 'page' : undefined}><Icon size={18} strokeWidth={1.8} /><span>{demoMode && id === 'upload' ? 'Upload a scan' : demoMode && id === 'home' ? 'Home' : label}</span>{id === 'upload' && <span className="nav-plus" aria-hidden="true">+</span>}</button>)}
      {user?.role === 'ADMIN' && <button className={cx('nav-item', active === 'admin' && 'nav-active')} onClick={() => onChange('admin')}><Settings size={18}/><span>Admin panel</span></button>}
    </nav>
    {!demoMode && <><div className="sidebar-divider" />
      <div className="workspace-label">PREFERENCES</div>
      <nav aria-label="Preferences">
        <button className={cx('nav-item', active === 'notifications' && 'nav-active')} onClick={() => onChange('notifications')}><Bell size={18} /><span>Notifications</span></button>
        <button className={cx('nav-item', active === 'settings' && 'nav-active')} onClick={() => onChange('settings')}><Settings size={18} /><span>Account settings</span></button>
      </nav></>}
    <div className="sidebar-spacer" />
    {demoMode ? <div className="demo-sidebar-note"><span className="demo-sidebar-dot" />No login · Saved on this device</div> : <><button className="plan-card plan-card-button" onClick={() => onChange('settings')}><div className="plan-icon"><Zap size={15} fill="currentColor" /></div><div><strong>{`${subscription?.planCode || 'Plan'} workspace`}</strong><small>{subscription ? subscription.scansUsed+' / '+(subscription.scanLimit<0?'∞':subscription.scanLimit)+' scans this month' : 'View plan and usage'}</small></div><ArrowRight size={14} /></button>
      <div className="profile-row"><div className="avatar">OD</div><div className="profile-copy"><strong>My account</strong><small>Personal workspace</small></div><button className="icon-button" aria-label="Sign out" onClick={onLogout}><LogOut size={16} /></button></div></>}
  </aside>
}

function Topbar({ onMenu, onNavigate, demoMode = false }) {
  return <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onMenu}><Menu size={20} /></button><div className="breadcrumbs">{demoMode ? <strong>OBD AI · Browser demo</strong> : <><span>Workspace</span><span className="crumb-slash">/</span><strong>Diagnostic center</strong></>}</div><div className="topbar-actions">{demoMode ? <div className="system-live"><span /> Saved on this device</div> : <><div className="system-live"><span /> Private workspace</div><button className="top-icon" aria-label="Search reports" title="Search reports" onClick={() => onNavigate('reports')}><Search size={17} /></button><button className="top-icon notification-icon" aria-label="Notifications" title="Notifications" onClick={() => onNavigate('notifications')}><Bell size={17} /><i /></button><button className="top-avatar top-avatar-button" aria-label="Account settings" onClick={() => onNavigate('settings')}>OD</button></>}</div></header>
}

function Overview({ onNavigate, demoMode = false }) {
  const queryClient = useQueryClient()
  const sample = useMutation({ mutationFn: async () => (await http.post('/demo/sample')).data, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }) })
  const reportsQuery = useQuery({ queryKey: ['reports'], queryFn: async () => (await http.get('/reports', { params: { limit: 8 } })).data })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: async () => (await http.get('/vehicles')).data })
  const reports = Array.isArray(reportsQuery.data) ? reportsQuery.data : reportsQuery.data?.items || []
  const vehicles = Array.isArray(vehiclesQuery.data) ? vehiclesQuery.data : vehiclesQuery.data?.items || []
  const latest = reports[0]
  const urgent = demoMode ? null : (latest?.diagnostics || []).filter((d) => ['HIGH', 'CRITICAL'].includes(d.severity)).length
  const scoredReports = reports.filter((r) => r.healthScore != null)
  const average = scoredReports.length ? Math.round(scoredReports.reduce((sum, r) => sum + r.healthScore, 0) / scoredReports.length) : null
  if (demoMode) return <DemoOverview reports={reports} loading={reportsQuery.isLoading} error={reportsQuery.isError} sample={sample} onNavigate={onNavigate} />
  return <div className="content">
    <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> {demoMode ? 'NO ACCOUNT NEEDED' : 'YOUR GARAGE AT A GLANCE'}</div><h1>{demoMode ? 'Explore the diagnostic center.' : 'Good to have you back.'}</h1><p>{demoMode ? 'Upload your own text scan or try the sample report.' : 'Here’s what’s happening across your vehicles.'}</p></div><div className="welcome-actions">{demoMode && <button className="button button-secondary" onClick={() => sample.mutate()} disabled={sample.isPending}>{sample.isPending ? <span className="spinner" /> : <FileText size={15} />} Try sample scan</button>}<button className="button button-primary" onClick={() => onNavigate('upload')}><Upload size={16} /> Run a diagnostic</button></div></div>
    {(reportsQuery.isError || vehiclesQuery.isError) && <InlineError message="Your workspace data could not be loaded. Check your connection, then refresh." />}
    <div className="metric-grid">
      <MetricCard icon={CarFront} label="Vehicles in garage" value={vehiclesQuery.isLoading ? '—' : vehicles.length} note={demoMode ? 'Saved in this browser' : 'Saved to your workspace'} tone="green" />
      <MetricCard icon={Activity} label="Scans completed" value={reportsQuery.isLoading ? '—' : reports.length} note="Diagnostic reports on file" tone="blue" />
      <MetricCard icon={Gauge} label="Average health" value={average === null ? '—' : average + '%'} note={demoMode ? 'Requires verified provider data' : average === null ? 'Available after your first scan' : 'Across available reports'} tone="amber" />
      <MetricCard icon={TriangleAlert} label="Needs attention" value={reportsQuery.isLoading || urgent === null ? '—' : urgent} note={demoMode ? 'Requires verified severity data' : 'High or critical findings'} tone={urgent ? 'red' : 'green'} />
    </div>
    <div className="dashboard-grid">
      <section className="panel health-panel"><div className="panel-heading"><div><span className="eyebrow">VEHICLE HEALTH</span><h2>Health over time</h2></div><button className="quiet-button" onClick={() => onNavigate('history')}>View history <ArrowRight size={14} /></button></div>
        {scoredReports.length > 1 ? <HealthTrend reports={scoredReports.slice().reverse()} /> : <div className="chart-empty"><div className="chart-empty-icon"><Activity size={20} /></div><strong>{scoredReports.length ? 'Your trend is taking shape' : 'No rated scans yet'}</strong><span>{reports.length ? 'Verified provider severity is needed to calculate a health score.' : 'Your scan history will appear here after your first diagnostic.'}</span><button className="text-link" onClick={() => onNavigate('upload')}>Start your first scan <ArrowRight size={14} /></button></div>}
      </section>
      <section className="panel vehicle-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR GARAGE</span><h2>Vehicles</h2></div><button className="quiet-button" onClick={() => onNavigate('garage')}>Manage <ArrowRight size={14} /></button></div>
        {vehiclesQuery.isLoading ? <LoadingRows /> : vehicles.length ? <div className="vehicle-list">{vehicles.slice(0, 3).map((v) => <VehicleRow key={v.id} vehicle={v} />)}</div> : <div className="small-empty"><div className="vehicle-ghost"><CarFront size={24} /></div><strong>Your garage is ready</strong><span>Add a vehicle to keep reports organized.</span><button className="text-link" onClick={() => onNavigate('garage')}>Add a vehicle <ArrowRight size={14} /></button></div>}
      </section>
    </div>
    <section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent diagnostics</h2></div><button className="quiet-button" onClick={() => onNavigate('reports')}>All reports <ArrowRight size={14} /></button></div>
      {reportsQuery.isLoading ? <LoadingRows /> : reports.length ? <ReportTable reports={reports.slice(0, 5)} onOpen={() => onNavigate('reports')} /> : <div className="table-empty"><div className="table-empty-mark"><FileClock size={18} /></div><div><strong>No reports to show</strong><span>Upload an OBD export to create your first diagnostic report.</span></div><button className="button button-secondary" onClick={() => onNavigate('upload')}>Upload a scan <ArrowRight size={15} /></button></div>}
    </section>
    <div className="trust-note"><Shield size={14} /><span>Diagnostic findings are informational. Code descriptions and repair recommendations show their source and confidence when available.</span><button title="Learn about diagnostic confidence"><CircleHelp size={15} /></button></div>
  </div>
}

function DemoOverview({ reports, loading, error, sample, onNavigate }) {
  return <div className="content demo-home">
    <section className="demo-welcome">
      <div className="demo-welcome-copy">
        <span className="eyebrow"><span className="eyebrow-dot" /> FREE BROWSER DEMO</span>
        <h1>Check your scanner export.</h1>
        <p>No account or API key needed. Upload a text scan, or try the sample to see how reports work.</p>
        <div className="demo-welcome-actions">
          <button className="button button-primary" onClick={() => onNavigate('upload')}><Upload size={16} /> Upload a scan</button>
          <button className="button button-secondary" onClick={() => sample.mutate()} disabled={sample.isPending}>{sample.isPending ? <span className="spinner" /> : <FileText size={15} />}{sample.isPending ? 'Loading sample…' : 'Try sample report'}</button>
        </div>
        {sample.isError && <div className="form-error" role="alert"><TriangleAlert size={16} />The sample could not be loaded. Please try again.</div>}
      </div>
      <div className="demo-welcome-art" aria-hidden="true"><div className="demo-art-ring ring-one"/><div className="demo-art-ring ring-two"/><div className="demo-engine"><Activity size={46}/><span>OBD II</span></div><i className="art-dot dot-one"/><i className="art-dot dot-two"/><i className="art-dot dot-three"/></div>
    </section>
    <section className="demo-steps" aria-label="How to use the demo">
      <div><span>1</span><p><strong>Choose a scan</strong><small>TXT, CSV, JSON, XML, or LOG</small></p></div>
      <ArrowRight className="demo-step-arrow" size={16}/>
      <div><span>2</span><p><strong>Review extracted codes</strong><small>Parsed in this browser</small></p></div>
      <ArrowRight className="demo-step-arrow" size={16}/>
      <div><span>3</span><p><strong>Keep your report</strong><small>Saved on this device</small></p></div>
    </section>
    {error && <InlineError message="Your saved scans could not be loaded. Refresh the page and try again." />}
    <section className="panel demo-recent">
      <div className="panel-heading"><div><span className="eyebrow">ON THIS DEVICE</span><h2>Your recent scans</h2></div><button className="quiet-button" onClick={() => onNavigate('reports')}>View all <ArrowRight size={14}/></button></div>
      {loading ? <LoadingRows/> : reports.length ? <ReportTable reports={reports.slice(0, 5)} onOpen={() => onNavigate('reports')}/> : <div className="demo-empty"><div className="table-empty-mark"><FileClock size={18}/></div><div><strong>No scans yet</strong><span>Upload a scanner export or try the sample report to get started.</span></div><button className="button button-secondary" onClick={() => onNavigate('upload')}>Upload a scan <ArrowRight size={15}/></button></div>}
    </section>
    <p className="demo-footnote"><Shield size={14}/> This demo extracts code-shaped text only. It does not confirm code meanings, severity, repairs, or safety advice.</p>
  </div>
}

function MetricCard({ icon: Icon, label, value, note, tone }) {
  return <div className="metric-card"><div className={cx('metric-icon', 'tone-' + tone)}><Icon size={18} /></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span></div>
}

function HealthTrend({ reports }) {
  const max = Math.max(100, ...reports.map((r) => r.healthScore || 0))
  return <div className="trend-chart" role="img" aria-label="Vehicle health scores by scan"><div className="trend-y"><span>100</span><span>50</span><span>0</span></div><div className="trend-plot"><div className="trend-gridline g1" /><div className="trend-gridline g2" /><div className="trend-bars">{reports.map((r, i) => <div key={r.id || i} className="trend-col"><div className="trend-bar-wrap"><div className="trend-bar" style={{ height: Math.max(5, ((r.healthScore || 0) / max) * 100) + '%' }} title={'Health ' + (r.healthScore ?? 'unavailable')} /></div><span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>)}</div></div></div>
}

function VehicleRow({ vehicle }) {
  return <div className="vehicle-row"><div className="vehicle-thumb"><CarFront size={21} /></div><div className="vehicle-details"><strong>{vehicle.nickname || [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'}</strong><span>{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Details not provided'}</span></div><ChevronDown size={15} className="muted-icon" /></div>
}

function ReportTable({ reports, onOpen, onDownload, onDelete, selectedIds = [] }) {
  return <div className="table-scroll"><table className="report-table"><thead><tr><th>VEHICLE / FILE</th><th>DATE</th><th>CODES</th><th>HEALTH</th><th>STATUS</th><th /></tr></thead><tbody>{reports.map((report) => {
    const count = (report.diagnostics || []).length
    const highest = (report.diagnostics || []).some((d) => d.severity === 'CRITICAL') ? 'Critical' : (report.diagnostics || []).some((d) => d.severity === 'HIGH') ? 'Review' : count ? 'Scanned' : 'No codes'
    return <tr key={report.id} className={selectedIds.includes(report.id)?'report-selected':''} aria-selected={selectedIds.includes(report.id)} onClick={() => onOpen?.(report)} tabIndex="0" onKeyDown={(e) => e.key === 'Enter' && onOpen?.(report)}><td><div className="report-primary"><div className="report-file-icon"><FileText size={16} /></div><div><strong>{report.vehicleName || report.fileName || 'Diagnostic scan'}</strong><span>{report.fileName || 'Uploaded diagnostic'}</span></div></div></td><td>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—'}</td><td><span className="code-count">{count} {count === 1 ? 'code' : 'codes'}</span></td><td><HealthBadge score={report.healthScore} /></td><td><StatusPill status={highest} /></td><td><div className="row-actions">{onDownload && <button className="row-action" aria-label={'Download ' + (report.fileName || 'report')} onClick={(e) => { e.stopPropagation(); onDownload(report) }}><Download size={14} /></button>}{onDelete && <button className="row-action danger-action" aria-label={'Delete ' + (report.fileName || 'report')} onClick={(e) => { e.stopPropagation(); onDelete(report) }}><Trash2 size={14} /></button>}<button className="row-arrow" aria-label="Open report"><ArrowRight size={16} /></button></div></td></tr>
  })}</tbody></table></div>
}

function HealthBadge({ score }) {
  if (score == null) return <span className="health-na">—</span>
  const tone = score >= 80 ? 'green' : score >= 55 ? 'amber' : 'red'
  return <span className={'health-badge ' + tone}><i />{score}</span>
}
function StatusPill({ status }) { return <span className={cx('status-pill', status === 'Critical' ? 'critical' : status === 'Review' ? 'review' : 'neutral')}><i />{status}</span> }

function UploadPage({ onSaved, demoMode = false }) {
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(null)
  const mutation = useMutation({
    mutationFn: async () => {
      const body = new FormData()
      body.append('file', file)
      return (await http.post('/scans/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: (data) => setCompleted(data),
    onError: (e) => setError(errorMessage(e, 'We could not process this file.')),
  })
  const choose = (candidate) => {
    if (!candidate) return
    setError('')
    if (candidate.size > 20 * 1024 * 1024) { setFile(null); setError('This file is larger than the 20 MB upload limit.'); return }
    setCompleted(null); setFile(candidate)
  }
  const onDrop = (event) => { event.preventDefault(); setDrag(false); choose(event.dataTransfer.files?.[0]) }
  return <div className="content narrow-content">
    <PageIntro eyebrow="NEW DIAGNOSTIC" title="Upload a scanner export" description={demoMode ? 'Extract code-shaped text from a scanner export in this browser. This demo does not verify code meanings or repairs.' : 'Bring your OBD report in. We’ll extract codes, identify vehicle details when present, and build a traceable diagnostic report.'} />
    {completed ? <div className="panel upload-result"><div className="result-check"><Check size={24} /></div><span className="eyebrow">SCAN PROCESSED</span><h2>Your report is ready</h2><p>{completed.diagnostics?.length || 0} diagnostic codes extracted from <strong>{completed.fileName || file?.name}</strong>.</p><div className="result-meta"><span><FileText size={15} /> {completed.vehicleName || 'Vehicle details unavailable'}</span><span><Clock3 size={15} /> {new Date(completed.createdAt || Date.now()).toLocaleString()}</span></div><div className="result-actions"><button className="button button-primary" onClick={onSaved}>Open report history <ArrowRight size={16} /></button><button className="button button-ghost" onClick={() => { setCompleted(null); setFile(null) }}>Upload another</button></div></div> : <>
      <div className="upload-steps"><div className="step active"><span>01</span><div><strong>Choose file</strong><small>Scanner export</small></div></div><div className="step-line" /><div className="step"><span>02</span><div><strong>Review scan</strong><small>Codes & vehicle</small></div></div><div className="step-line" /><div className="step"><span>03</span><div><strong>Get your report</strong><small>Recommendations</small></div></div></div>
      <div className={cx('dropzone', drag && 'dropzone-active', file && 'dropzone-file')} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
        <input id="scan-file" type="file" aria-label="Scanner export file" onChange={(e) => choose(e.target.files?.[0])} />
        <div className="upload-icon"><CloudUpload size={24} /></div>
        {file ? <><strong>{file.name}</strong><span>{formatBytes(file.size)} · Ready to process</span><button className="text-link" type="button" onClick={() => setFile(null)}>Remove file</button></> : <><strong>Drop your diagnostic file here</strong><span>or <label htmlFor="scan-file" className="browse-link">browse files</label> on your device</span><small>TXT, CSV, JSON, XML, LOG or custom text exports · Max 20 MB</small></>}
      </div>
      {error && <div className="form-error"><TriangleAlert size={16} />{error}</div>}
      <div className="supported-card"><div className="supported-icon"><Activity size={19} /></div><div><strong>Made for scanner exports</strong><p>Torque Pro, Car Scanner, OBD Fusion, BlueDriver, ELM327 logs, manufacturer tools and custom text exports. Unknown layouts are scanned for valid DTCs.</p></div><button title="Supported formats" aria-label="About supported formats"><CircleHelp size={16} /></button></div>
      <div className="privacy-line"><LockKeyhole size={14} />{demoMode ? 'The file is read in your browser. Only extracted codes and report details are saved on this device.' : 'Files are validated on upload and are only visible within your account.'}</div>
      <div className="upload-footer"><button className="button button-ghost" onClick={() => setFile(null)} disabled={!file || mutation.isPending}>Clear selection</button><button className="button button-primary" disabled={!file || mutation.isPending} onClick={() => { setError(''); mutation.mutate() }}>{mutation.isPending ? <><span className="spinner" /> Analyzing scan…</> : <>Analyze file <ArrowRight size={16} /></>}</button></div>
    </>}
  </div>
}

function formatBytes(size) { return size < 1024 * 1024 ? Math.max(1, Math.round(size / 1024)) + ' KB' : (size / (1024 * 1024)).toFixed(1) + ' MB' }

function Garage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [message, setMessage] = useState('')
  const query = useQuery({ queryKey: ['vehicles'], queryFn: async () => (await http.get('/vehicles')).data })
  const items = Array.isArray(query.data) ? query.data : query.data?.items || []
  const save = useMutation({
    mutationFn: async (body) => (await http.post('/vehicles', body)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setFormOpen(false); setMessage('Vehicle added to your garage.') },
    onError: (e) => setMessage(errorMessage(e, 'Vehicle could not be saved.')),
  })
  return <div className="content"><PageIntro eyebrow="YOUR GARAGE" title="Vehicle garage" description="Keep your vehicles and their diagnostic history together." action={<button className="button button-primary" onClick={() => setFormOpen(!formOpen)}><CarFront size={16} /> Add vehicle</button>} />
    {message && <div className={cx('inline-notice', save.isError && 'notice-error')}>{message}<button aria-label="Dismiss message" onClick={() => setMessage('')}><X size={15} /></button></div>}
    {formOpen && <VehicleForm onSubmit={(body) => save.mutate(body)} busy={save.isPending} onCancel={() => setFormOpen(false)} />}
    {query.isError ? <InlineError message="Vehicles could not be loaded." /> : query.isLoading ? <div className="vehicle-cards"><LoadingCard /><LoadingCard /></div> : items.length ? <div className="vehicle-cards">{items.map((v) => <VehicleCard key={v.id} vehicle={v} onDeleted={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })} />)}</div> : !formOpen && <EmptyPanel icon={CarFront} title="Nothing in the garage yet" text="Add a vehicle by VIN or enter its details. Your reports can be linked to it later." action={<button className="button button-primary" onClick={() => setFormOpen(true)}>Add your first vehicle <ArrowRight size={15} /></button>} />}
  </div>
}

function VehicleForm({ onSubmit, busy, onCancel }) {
  const [vin, setVin] = useState('')
  const [decoding, setDecoding] = useState(false)
  const [decodeError, setDecodeError] = useState('')
  const [decoded, setDecoded] = useState(null)
  const decode = async () => {
    if (vin.trim().length !== 17) { setDecodeError('Enter a 17-character VIN to decode.'); return }
    setDecoding(true); setDecodeError('')
    try {
      const result = (await http.get('/vehicles/decode-vin/' + encodeURIComponent(vin.trim()))).data
      setDecoded(result)
    } catch (e) { setDecodeError(errorMessage(e, 'VIN decoding is temporarily unavailable.')) }
    finally { setDecoding(false) }
  }
  return <form className="panel vehicle-form" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); onSubmit({ vin: vin.trim() || null, nickname: fd.get('nickname') || null, make: decoded?.make || fd.get('make') || null, model: decoded?.model || fd.get('model') || null, year: decoded?.year || (fd.get('year') ? Number(fd.get('year')) : null), mileage: fd.get('mileage') ? Number(fd.get('mileage')) : null }) }}>
    <div className="form-panel-heading"><div><span className="eyebrow">VEHICLE DETAILS</span><h2>Add a vehicle</h2></div><button type="button" className="icon-button" aria-label="Close vehicle form" onClick={onCancel}><X size={18} /></button></div>
    <div className="vin-row"><label className="field-label">Vehicle identification number (VIN)<input value={vin} onChange={(e) => { setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)); setDecoded(null) }} placeholder="17-character VIN" maxLength="17" /></label><button type="button" className="button button-secondary decode-button" onClick={decode} disabled={decoding}>{decoding ? <span className="spinner" /> : <Search size={15} />} Decode VIN</button></div>
    {decodeError && <div className="form-error"><TriangleAlert size={15} />{decodeError}</div>}
    {decoded && <div className="decoded-note"><Check size={15} />{[decoded.year, decoded.make, decoded.model, decoded.engine].filter(Boolean).join(' · ') || 'VIN decoded'} <small>via NHTSA vPIC</small></div>}
    <div className="form-grid"><label className="field-label">Nickname<input name="nickname" placeholder="e.g. Daily driver" /></label><label className="field-label">Make<input name="make" defaultValue={decoded?.make || ''} placeholder="Make" /></label><label className="field-label">Model<input name="model" defaultValue={decoded?.model || ''} placeholder="Model" /></label><label className="field-label">Year<input name="year" type="number" min="1886" max="2100" defaultValue={decoded?.year || ''} placeholder="Year" /></label><label className="field-label">Mileage<input name="mileage" type="number" min="0" placeholder="Current mileage" /></label></div>
    <div className="form-actions"><button type="button" className="button button-ghost" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Check size={15} />} Save vehicle</button></div>
  </form>
}

function VehicleCard({ vehicle, onDeleted }) {
  const [confirm, setConfirm] = useState(false)
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)
  const remove = useMutation({ mutationFn: () => http.delete('/vehicles/' + vehicle.id), onSuccess: onDeleted })
  return <article className="panel vehicle-card"><div className="vehicle-card-art"><CarFront size={44} strokeWidth={1.25} /><span>GARAGE / {String(vehicle.id).slice(-4)}</span></div><div className="vehicle-card-body"><div className="vehicle-card-title"><div><span className="eyebrow">SAVED VEHICLE</span><h2>{vehicle.nickname || [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Unnamed vehicle'}</h2><p>{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' · ') || 'Vehicle details pending'}</p></div><div className="vehicle-title-actions"><button className="quiet-button" onClick={() => setMaintenanceOpen(!maintenanceOpen)}>{maintenanceOpen?'Hide service log':'Service log'}</button><button className="quiet-button" onClick={() => setConfirm(!confirm)}>{confirm ? 'Cancel' : 'Remove'}</button></div></div>{vehicle.vin && <div className="vehicle-vin"><span>VIN</span><code>{vehicle.vin}</code></div>}<div className="vehicle-card-footer"><span><Gauge size={15} />{vehicle.mileage ? Number(vehicle.mileage).toLocaleString() + ' mi' : 'Mileage not recorded'}</span><span><FileClock size={15} />{vehicle.reportCount ?? 0} reports</span></div>{confirm && <div className="confirm-row"><span>Remove this vehicle from your garage?</span><button onClick={() => remove.mutate()} disabled={remove.isPending} className="danger-link">{remove.isPending ? 'Removing…' : 'Confirm remove'}</button></div>}{maintenanceOpen&&<MaintenancePanel vehicle={vehicle}/>}</div></article>
}

function MaintenancePanel({vehicle}) {
  const qc=useQueryClient()
  const [expanded,setExpanded]=useState(false)
  const q=useQuery({queryKey:['maintenance',vehicle.id],queryFn:async()=>(await http.get('/vehicles/'+vehicle.id+'/maintenance')).data})
  const save=useMutation({mutationFn:body=>http.post('/vehicles/'+vehicle.id+'/maintenance',body),onSuccess:()=>{qc.invalidateQueries({queryKey:['maintenance',vehicle.id]});qc.invalidateQueries({queryKey:['vehicles']});setExpanded(false)}})
  const items=Array.isArray(q.data)?q.data:[]
  return <section className="maintenance-panel"><div className="maintenance-heading"><div><strong>Maintenance records</strong><span>Service notes saved with this vehicle</span></div><button className="quiet-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Cancel':'+ Add record'}</button></div>
    {expanded&&<form className="maintenance-form" onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);save.mutate({title:fd.get('title'),notes:fd.get('notes')||null,performedAt:fd.get('date')?new Date(fd.get('date')).toISOString():null,cost:fd.get('cost')?Number(fd.get('cost')):null,mileage:fd.get('mileage')?Number(fd.get('mileage')):null})}}><label className="field-label">Service or repair<input name="title" placeholder="e.g. Oil and filter change" required maxLength="140"/></label><div className="maintenance-inputs"><label className="field-label">Date<input name="date" type="date"/></label><label className="field-label">Mileage<input name="mileage" type="number" min="0"/></label><label className="field-label">Cost<input name="cost" type="number" min="0" step="0.01" placeholder="0.00"/></label></div><label className="field-label">Notes<textarea name="notes" rows="2" maxLength="1000" placeholder="Optional details"/></label><button className="button button-primary" disabled={save.isPending}>{save.isPending?<span className="spinner"/>:'Save service record'}</button></form>}
    {q.isError?<InlineError message="Service records could not be loaded."/>:q.isLoading?<LoadingRows/>:items.length?<div className="maintenance-items">{items.map(item=><div className="maintenance-item" key={item.id}><div><strong>{item.title}</strong><span>{item.performedAt?new Date(item.performedAt).toLocaleDateString():'Date not recorded'}{item.mileage?' · '+Number(item.mileage).toLocaleString()+' mi':''}</span>{item.notes&&<small>{item.notes}</small>}</div><b>{item.cost==null?'':new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(item.cost)}</b></div>)}</div>:<div className="maintenance-empty">No service records saved yet.</div>}
  </section>
}

function Reports({ history = false, demoMode = false }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [error, setError] = useState('')
  const query = useQuery({ queryKey: ['reports'], queryFn: async () => (await http.get('/reports')).data })
  const reports = Array.isArray(query.data) ? query.data : query.data?.items || []
  const filtered = reports.filter((r) => (r.fileName || '').toLowerCase().includes(search.toLowerCase()) || (r.vehicleName || '').toLowerCase().includes(search.toLowerCase()) || (r.diagnostics || []).some((d) => d.code?.toLowerCase().includes(search.toLowerCase())))
  const download = async (report) => {
    try {
      const result = await http.get('/reports/' + report.id + '/pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(result.data); const a = document.createElement('a'); a.href = url; a.download = 'obd-diagnostic-' + report.id + '.pdf'; a.click(); URL.revokeObjectURL(url)
    } catch (e) { setError(errorMessage(e, 'PDF export is unavailable.')) }
  }
  const remove = useMutation({ mutationFn: (id) => http.delete('/reports/' + id), onSuccess: () => query.refetch(), onError: (e) => setError(errorMessage(e)) })
  return <div className="content"><PageIntro eyebrow={history ? 'SCAN HISTORY' : 'REPORT LIBRARY'} title={history ? 'Scan history' : 'Diagnostic reports'} description={history ? 'Search and revisit every uploaded diagnostic.' : 'Review findings, compare codes, and download professional reports.'} />
    {error && <div className="inline-notice notice-error">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
    {selected ? <ReportDetail report={selected} onBack={() => setSelected(null)} onDownload={() => download(selected)} /> : compareMode && selectedIds.length===2 ? <ComparePanel reports={reports.filter(r=>selectedIds.includes(r.id))} onBack={()=>{setSelectedIds([]);setCompareMode(false)}}/> : <>
      <div className="list-toolbar"><label className="search-field"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports, vehicles or codes" /></label><div className="toolbar-tools"><div className="toolbar-result">{filtered.length} {filtered.length === 1 ? 'report' : 'reports'}</div>{reports.length>1&&<button className={cx('button',compareMode?'button-primary':'button-secondary','compare-toggle')} onClick={()=>{setCompareMode(!compareMode);setSelectedIds([])}}>{compareMode?'Cancel compare':'Compare scans'}{compareMode&&selectedIds.length>0?' · '+selectedIds.length+'/2':''}</button>}</div></div>
      {compareMode&&selectedIds.length<2&&<div className="compare-hint"><Activity size={15}/><span>Select two rows to compare their health scores and detected code sets.</span></div>}
      {query.isError ? <InlineError message="Reports could not be loaded." /> : query.isLoading ? <div className="panel"><LoadingRows /></div> : filtered.length ? <section className="panel report-list-panel"><ReportTable reports={filtered} selectedIds={compareMode?selectedIds:[]} onOpen={compareMode?(report=>setSelectedIds(ids=>ids.includes(report.id)?ids.filter(id=>id!==report.id):ids.length<2?[...ids,report.id]:[ids[1],report.id])):setSelected} onDownload={download} onDelete={(report) => { if (window.confirm('Delete this diagnostic report? This cannot be undone.')) remove.mutate(report.id) }} /><div className="report-bulk-note"><Shield size={14} />{demoMode ? 'Reports are saved locally in this browser. PDF export contains extracted codes and unverified demo notes.' : 'Reports are private to your account. PDF export includes only saved diagnostic data.'}</div></section> : <EmptyPanel icon={FileText} title={search ? 'No matching reports' : 'No reports yet'} text={search ? 'Try another file name, vehicle, or diagnostic code.' : 'Upload a scanner export to create a searchable report with code findings.'} />}
    </>}
  </div>
}

function ComparePanel({reports,onBack}) {
  const [a,b]=reports
  const aCodes=new Set((a.diagnostics||[]).map(d=>d.code))
  const bCodes=new Set((b.diagnostics||[]).map(d=>d.code))
  const codes=[...new Set([...aCodes,...bCodes])].sort()
  const delta=a.healthScore==null||b.healthScore==null?null:b.healthScore-a.healthScore
  return <div className="content"><div className="detail-toolbar"><button className="quiet-button" onClick={onBack}>← Back to history</button><span className="eyebrow">SCAN COMPARISON</span></div>
    <div className="compare-cards">{[a,b].map((r,i)=><section className="panel compare-card" key={r.id}><span className="eyebrow">{i?'NEWER SCAN':'EARLIER SCAN'}</span><h2>{r.vehicleName||r.fileName}</h2><p>{r.createdAt?new Date(r.createdAt).toLocaleString():'Date unavailable'}</p><div className="compare-score">{r.healthScore??'—'}<small>{r.healthScore==null?'':'/100'}</small></div><span>{r.diagnostics?.length||0} detected codes</span></section>)}</div>
    <div className="panel compare-summary"><div className="panel-heading"><div><span className="eyebrow">CHANGE OVER TIME</span><h2>Health score</h2></div><strong className={delta===null?'':delta>0?'score-up':delta<0?'score-down':''}>{delta===null?'Not enough verified scores':(delta>0?'+':'')+delta+' points'}</strong></div><p>Code presence is compared below. A code appearing or clearing in an exported scan does not confirm the underlying repair or fault status.</p></div>
    <div className="panel compare-code-table"><div className="panel-heading"><div><span className="eyebrow">CODE COMPARISON</span><h2>Detected codes</h2></div></div><div className="table-scroll"><table className="report-table"><thead><tr><th>CODE</th><th>{a.fileName||'Earlier scan'}</th><th>{b.fileName||'Later scan'}</th><th>CHANGE</th></tr></thead><tbody>{codes.map(code=><tr key={code}><td><code className="compare-code">{code}</code></td><td>{aCodes.has(code)?<span className="status-pill review"><i/>Detected</span>:<span className="health-na">Not detected</span>}</td><td>{bCodes.has(code)?<span className="status-pill review"><i/>Detected</span>:<span className="health-na">Not detected</span>}</td><td>{aCodes.has(code)&&bCodes.has(code)?'Persisted':!aCodes.has(code)&&bCodes.has(code)?'New in later scan':'Not detected later'}</td></tr>)}</tbody></table></div></div>
  </div>
}

function ReportDetail({ report, onBack, onDownload }) {
  return <div className="report-detail"><div className="detail-toolbar"><button className="quiet-button" onClick={onBack}>← Back to reports</button><button className="button button-secondary" onClick={onDownload}><Download size={15} /> Download PDF</button></div><section className="panel detail-hero"><div><span className="eyebrow">DIAGNOSTIC REPORT</span><h2>{report.vehicleName || report.fileName || 'OBD scan'}</h2><p>{report.fileName} · {report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}</p></div><div className="detail-score"><span>HEALTH SCORE</span><strong>{report.healthScore ?? '—'}<small>{report.healthScore == null ? '' : '/100'}</small></strong></div></section>{report.summary && <section className="panel detail-summary"><span className="eyebrow">TECHNICAL SUMMARY</span><p>{report.summary}</p></section>}<section className="panel findings-panel"><div className="panel-heading"><div><span className="eyebrow">CODE FINDINGS</span><h2>{report.diagnostics?.length || 0} detected codes</h2></div></div>{report.diagnostics?.length ? <div className="finding-list">{report.diagnostics.map((d) => <Finding key={d.code} item={d} />)}</div> : <div className="small-empty"><strong>No valid DTC codes found</strong><span>Vehicle metadata and raw scan details are still included in the saved report.</span></div>}</section>{report.aiAnalysis && <section className="panel detail-summary"><span className="eyebrow"><Sparkles size={13} /> AI MECHANIC ANALYSIS</span><p>{report.aiAnalysis}</p></section>}</div>
}

function Finding({ item }) {
  return <article className="finding-card"><div className="finding-top"><code>{item.code}</code><Severity severity={item.severity} /><span className="confidence">Confidence {item.confidence == null ? 'unavailable' : Math.round(item.confidence * 100) + '%'}</span></div><h3>{item.title || 'Code details not resolved'}</h3><p>{item.description || 'A diagnostic code was present in the scan, but no configured data provider returned a verified description.'}</p>{item.causes?.length > 0 && <div className="finding-causes"><strong>Reported possible causes</strong><span>{item.causes.join(' · ')}</span></div>}<div className="finding-meta"><span><Shield size={14} />{item.drivingRecommendation || 'Have the code verified before making repair decisions'}</span>{item.source && <span>Source: {item.source}</span>}</div></article>
}

function Severity({ severity }) {
  const value = severity || 'UNKNOWN'
  return <span className={cx('severity-tag', 'severity-' + value.toLowerCase())}><i />{value === 'UNKNOWN' ? 'UNVERIFIED' : value}</span>
}

function Assistant({ demoMode = false }) {
  const [text, setText] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const mutation = useMutation({ mutationFn: async (question) => (await http.post('/ai/assistant', { message: question })).data, onSuccess: (data) => setAnswer(data.answer), onError: (e) => setError(errorMessage(e, 'AI analysis could not be completed.')) })
  return <div className="content narrow-content"><PageIntro eyebrow={demoMode ? 'DEMO GUIDANCE' : 'AI MECHANIC'} title={demoMode ? 'Review your scan codes' : 'Ask about your scan'} description={demoMode ? 'This browser-only preview does not call an AI service. It can show the codes extracted from your latest local report.' : 'Get plain-language help grounded in your saved diagnostic reports. AI explanations are advisory and identify when data is missing.'} />
    <div className="assistant-notice"><Sparkles size={17} /><div><strong>{demoMode ? 'Local demo response' : 'Source-aware answers'}</strong><span>{demoMode ? 'No prompt or scan is sent to an AI provider in this demo.' : 'The assistant uses your saved scan findings. It won’t claim a code was resolved unless a diagnostic provider supplied that data.'}</span></div></div>
    <form className="panel assistant-form" onSubmit={(e) => { e.preventDefault(); setError(''); setAnswer(''); mutation.mutate(text.trim()) }}><label className="field-label">What would you like to understand?<textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: Which item in my latest scan should I discuss with a mechanic first?" rows="4" maxLength="1000" required /></label><div className="assistant-form-footer"><span>{text.length}/1000 characters</span><button className="button button-primary" disabled={mutation.isPending || !text.trim()}>{mutation.isPending ? <><span className="spinner" /> Thinking…</> : <><Sparkles size={15} /> Ask assistant</>}</button></div></form>
    {error && <div className="form-error"><TriangleAlert size={16} />{error}</div>}
    {answer && <div className="panel assistant-answer"><span className="eyebrow">ASSISTANT RESPONSE</span><p>{answer}</p><small><Shield size={13} /> Confirm safety-critical decisions with a qualified technician.</small></div>}
    <div className="assistant-empty"><MessageCircle size={18} /><span>{demoMode ? 'Responses are rule-based demo text, not AI analysis. Verify safety-critical concerns with a qualified technician.' : 'Questions are sent securely to the configured AI provider and are not used as a replacement for professional inspection.'}</span></div>
  </div>
}

function Notifications() {
  const qc=useQueryClient()
  const query=useQuery({queryKey:['notifications'],queryFn:async()=>(await http.get('/notifications')).data})
  const rows=Array.isArray(query.data)?query.data:[]
  const change=useMutation({mutationFn:({id,remove})=>remove?http.delete('/notifications/'+id):http.post('/notifications/'+id+'/read'),onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']})})
  return <div className="content"><PageIntro eyebrow="WORKSPACE" title="Notifications" description="Important scan and account activity for your workspace." />
    {query.isError?<InlineError message="Notifications could not be loaded."/>:query.isLoading?<div className="panel"><LoadingRows/></div>:rows.length?<div className="panel notification-list">{rows.map(n=><article className={cx('notification-row',!n.readAt&&'unread')} key={n.id}><div className="notification-mark"><Bell size={16}/></div><div className="notification-copy"><strong>{n.title}</strong><span>{n.body}</span><small>{new Date(n.createdAt).toLocaleString()}</small></div><div className="notification-actions">{!n.readAt&&<button className="quiet-button" onClick={()=>change.mutate({id:n.id})}>Mark read</button>}<button className="row-action danger-action" aria-label="Delete notification" onClick={()=>change.mutate({id:n.id,remove:true})}><Trash2 size={14}/></button></div></article>)}</div>:<EmptyPanel icon={Bell} title="You’re all caught up" text="Scan processing and account notifications will appear here when available."/>}
  </div>
}
function SettingsPage({ demoMode = false }) {
  const query=useQuery({queryKey:['subscription'],queryFn:async()=>(await http.get('/subscriptions/me')).data})
  const sub=query.data
  return <div className="content"><PageIntro eyebrow="PREFERENCES" title={demoMode ? 'Demo settings' : 'Account settings'} description={demoMode ? 'This preview does not create an account or send data to a server.' : 'Manage your account security and diagnostic preferences.'} />
    {query.isError&&<InlineError message="Subscription details could not be loaded."/>}
    <div className="settings-grid"><section className="panel settings-tile"><div className="settings-tile-icon"><Zap size={18}/></div><h2>{sub?.planCode||'Current plan'} plan</h2><p>{sub?sub.scansUsed+' of '+(sub.scanLimit<0?'unlimited':sub.scanLimit)+' scans used in this demo.':'Loading plan usage…'}</p><span className="settings-footnote">{demoMode ? 'No account or paid plan is attached to this browser demo.' : 'Plan changes are managed by your workspace administrator.'}</span></section><section className="panel settings-tile"><div className="settings-tile-icon"><LockKeyhole size={18} /></div><h2>{demoMode ? 'Browser storage' : 'Account security'}</h2><p>{demoMode ? 'Demo reports and vehicles stay in this browser’s local storage. Clearing site data removes them.' : 'Your session uses short-lived signed access tokens with rotating, secure refresh cookies.'}</p></section><section className="panel settings-tile"><div className="settings-tile-icon"><BookOpen size={18} /></div><h2>Diagnostic sources</h2><p>{demoMode ? 'Detected codes are extracted from text. No verified code definitions or repairs are provided in this preview.' : 'Descriptions and repair guidance show their source and confidence when a provider returns verified information.'}</p></section><section className="panel settings-tile"><div className="settings-tile-icon"><Shield size={18} /></div><h2>{demoMode ? 'Demo privacy' : 'Data privacy'}</h2><p>{demoMode ? 'Uploaded file text is processed in your browser. Saved report details are local to this device.' : 'Your uploaded scan records are associated with your account and protected by ownership checks.'}</p></section></div>
  </div>
}

function AdminPage() {
  const qc=useQueryClient()
  const [code,setCode]=useState('')
  const [message,setMessage]=useState('')
  const q=useQuery({queryKey:['adminOverview'],queryFn:async()=>(await http.get('/admin/overview')).data})
  const users=useQuery({queryKey:['adminUsers'],queryFn:async()=>(await http.get('/admin/users')).data})
  const plans=useQuery({queryKey:['adminPlans'],queryFn:async()=>(await http.get('/admin/plans')).data})
  const assign=useMutation({mutationFn:({id,planCode})=>http.put('/admin/users/'+id+'/plan',{planCode}),onSuccess:()=>{qc.invalidateQueries({queryKey:['adminUsers']});setMessage('Plan updated.')}})
  const changeRole=useMutation({mutationFn:({id,role})=>http.put('/admin/users/'+id+'/role',{role}),onSuccess:()=>{qc.invalidateQueries({queryKey:['adminUsers']});setMessage('Account role updated.')},onError:(e)=>setMessage(errorMessage(e))})
  const refresh=useMutation({mutationFn:()=>http.post('/admin/cache/'+code+'/refresh'),onSuccess:(r)=>setMessage(r.data?.title||'Diagnostic cache refreshed.'),onError:(e)=>setMessage(errorMessage(e))})
  const uploads=useQuery({queryKey:['adminUploads'],queryFn:async()=>(await http.get('/admin/uploads')).data})
  const adminReports=useQuery({queryKey:['adminReports'],queryFn:async()=>(await http.get('/admin/reports')).data})
  const adminVehicles=useQuery({queryKey:['adminVehicles'],queryFn:async()=>(await http.get('/admin/vehicles')).data})
  const openUpload=async(item)=>{try{const res=await http.get('/admin/uploads/'+item.id,{responseType:'blob'});const url=URL.createObjectURL(res.data);const a=document.createElement('a');a.href=url;a.download=item.fileName;a.click();URL.revokeObjectURL(url)}catch(e){setMessage(errorMessage(e,'Uploaded source could not be opened.'))}}
  const deleteReport=useMutation({mutationFn:id=>http.delete('/admin/reports/'+id),onSuccess:()=>{qc.invalidateQueries({queryKey:['adminReports']});qc.invalidateQueries({queryKey:['adminOverview']});setMessage('Report deleted.')},onError:e=>setMessage(errorMessage(e))})
  return <div className="content"><PageIntro eyebrow="ADMINISTRATION" title="System administration" description="Manage workspace accounts, plans, cached diagnostics, and service health."/>
    {message&&<div className="inline-notice">{message}<button aria-label="Dismiss message" onClick={()=>setMessage('')}><X size={15}/></button></div>}
    {q.isError?<InlineError message="Administrator access is required or service metrics are unavailable."/>:<div className="metric-grid admin-metrics">{[['Accounts',q.data?.users],['Reports',q.data?.reports],['Vehicles',q.data?.vehicles],['Cached codes',q.data?.unresolvedCodes]].map(([label,value])=><div className="metric-card" key={label}><span className="metric-label">{label}</span><strong className="metric-value">{value??'—'}</strong></div>)}</div>}
    <div className="admin-grid"><section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">ACCOUNT MANAGEMENT</span><h2>Users and plans</h2></div></div>{users.isLoading?<LoadingRows/>:users.isError?<InlineError message="User list unavailable."/>:<div className="admin-user-list">{users.data?.map(u=><div className="admin-user" key={u.id}><div className="admin-user-copy"><strong>{u.displayName}</strong><span>{u.email} · {u.role}</span></div><select aria-label={'Plan for '+u.email} value={u.planCode||'FREE'} onChange={(e)=>assign.mutate({id:u.id,planCode:e.target.value})}>{(plans.data||[]).map(p=><option value={p.code} key={p.code}>{p.code}</option>)}</select><select aria-label={'Role for '+u.email} value={u.role} onChange={e=>changeRole.mutate({id:u.id,role:e.target.value})}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div>)}</div>}</section>
    <section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">DIAGNOSTIC CACHE</span><h2>Refresh a code</h2></div></div><p className="admin-description">Refreshes one cached code through the configured diagnostic provider.</p><form className="admin-cache-form" onSubmit={(e)=>{e.preventDefault();refresh.mutate()}}><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength="5" pattern="[PCBU][0-3][A-F0-9]{3}" placeholder="P0300" aria-label="Diagnostic code"/><button className="button button-secondary" disabled={!/^[PCBU][0-3][A-F0-9]{3}$/.test(code)||refresh.isPending}>{refresh.isPending?<span className="spinner"/>:'Refresh'}</button></form><div className="admin-status"><span>AI provider</span><b className={q.data?.aiConfigured?'configured':'not-configured'}>{q.data?.aiConfigured?'Configured':'Not configured'}</b></div><div className="admin-status"><span>DTC provider</span><b className={q.data?.diagnosticProviderConfigured?'configured':'not-configured'}>{q.data?.diagnosticProviderConfigured?'Configured':'Not configured'}</b></div><div className="admin-status"><span>Redis cache</span><b className={q.data?.redisReachable?'configured':'not-configured'}>{q.data?.redisReachable?'Connected':'Unavailable'}</b></div></section></div>
    <div className="admin-grid"><section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">UPLOAD REVIEW</span><h2>Uploaded source files</h2></div><span className="toolbar-result">{uploads.data?.length||0} files</span></div>{uploads.isLoading?<LoadingRows/>:uploads.isError?<InlineError message="Upload review list unavailable."/>:uploads.data?.length?<div className="admin-user-list">{uploads.data.map(item=><div className="admin-user" key={item.id}><div className="admin-user-copy"><strong>{item.fileName}</strong><span>{item.sourceFormat.toUpperCase()} · {formatBytes(item.uploadedBytes)} · {new Date(item.createdAt).toLocaleDateString()}</span></div><button className="row-action" aria-label={'Download source '+item.fileName} onClick={()=>openUpload(item)} disabled={!item.available}><Download size={14}/></button></div>)}</div>:<div className="admin-description">No uploads are stored.</div>}</section>
    <section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">REPORT MANAGEMENT</span><h2>Recent reports</h2></div><span className="toolbar-result">{adminReports.data?.length||0} reports</span></div>{adminReports.isLoading?<LoadingRows/>:adminReports.isError?<InlineError message="Report management list unavailable."/>:adminReports.data?.length?<div className="admin-user-list">{adminReports.data.map(r=><div className="admin-user" key={r.id}><div className="admin-user-copy"><strong>{r.fileName}</strong><span>{new Date(r.createdAt).toLocaleString()}</span></div><button className="row-action danger-action" aria-label={'Delete report '+r.fileName} onClick={()=>{if(window.confirm('Delete this user report? This cannot be undone.'))deleteReport.mutate(r.id)}}><Trash2 size={14}/></button></div>)}</div>:<div className="admin-description">No reports stored.</div>}</section></div>
    <section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">VEHICLE MANAGEMENT</span><h2>Garage records</h2></div><span className="toolbar-result">{adminVehicles.data?.length||0} vehicles</span></div>{adminVehicles.isLoading?<LoadingRows/>:adminVehicles.isError?<InlineError message="Vehicle list unavailable."/>:adminVehicles.data?.length?<div className="table-scroll"><table className="report-table"><thead><tr><th>VEHICLE</th><th>VIN</th><th>MILEAGE</th><th>REPORTS</th></tr></thead><tbody>{adminVehicles.data.map(v=><tr key={v.id}><td>{v.nickname||[v.year,v.make,v.model].filter(Boolean).join(' ')||'Vehicle'}</td><td>{v.vin||'—'}</td><td>{v.mileage==null?'—':Number(v.mileage).toLocaleString()+' mi'}</td><td>{v.reportCount}</td></tr>)}</tbody></table></div>:<div className="admin-description">No vehicles saved.</div>}</section>
  </div>
}

function PageIntro({ eyebrow, title, description, action }) { return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function EmptyPanel({ icon: Icon, title, text, action }) { return <div className="panel empty-panel"><div className="empty-icon"><Icon size={22} /></div><h2>{title}</h2><p>{text}</p>{action}</div> }
function InlineError({ message }) { return <div className="inline-error"><TriangleAlert size={17} /><span>{message}</span></div> }
function LoadingRows() { return <div className="loading-rows"><span /><span /><span /></div> }
function LoadingCard() { return <div className="panel loading-card"><span /><span /><span /></div> }
function Toast({ message, onClose }) { useEffect(() => { const timer = setTimeout(onClose, 4200); return () => clearTimeout(timer) }, [onClose]); return <div className="toast"><Check size={16} />{message}<button onClick={onClose} aria-label="Dismiss"><X size={15} /></button></div> }

export default App
