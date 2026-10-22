import { enrichDiagnostic, inferVehicleMake } from './dtcReference.js'

const STORAGE_KEYS = {
  reports: 'obd.demo.reports',
  vehicles: 'obd.demo.vehicles',
  maintenance: 'obd.demo.maintenance',
  notifications: 'obd.demo.notifications',
}

const memory = Object.fromEntries(Object.keys(STORAGE_KEYS).map((key) => [key, []]))

function readList(name) {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS[name]) || '[]')
    if (!Array.isArray(value)) return []
    if (name !== 'reports') return value
    return value.map((report) => {
      const vehicleMake = report.vehicleMake || inferVehicleMake(`${report.fileName || ''} ${report.vehicleName || ''}`)
      return {
        ...report,
        vehicleMake,
        diagnostics: (report.diagnostics || []).map((item) => enrichDiagnostic(item, { make: vehicleMake })),
      }
    })
  } catch {
    return memory[name]
  }
}

function writeList(name, value) {
  memory[name] = value
  try { localStorage.setItem(STORAGE_KEYS[name], JSON.stringify(value)) } catch { /* Keep this session usable if storage is full or unavailable. */ }
}

const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
const newestFirst = (rows) => [...rows].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

function readFileBuffer(file) {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The selected PDF could not be read.'))
    reader.readAsArrayBuffer(file)
  })
}

async function extractPdfText(file) {
  let loadingTask
  try {
    const [pdfjs, worker] = await Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    loadingTask = pdfjs.getDocument({ data: new Uint8Array(await readFileBuffer(file)), isEvalSupported: false })
    const document = await loadingTask.promise
    if (document.numPages > 100) throw new Error('This PDF has more than 100 pages. Split it into smaller files or export the scanner data as text.')

    const pages = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent({ includeMarkedContent: false })
      pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
      page.cleanup()
    }
    const text = pages.join('\n')
    if (!text.trim()) throw new Error('No selectable text was found in this PDF. It may be a scanned image. Use OCR first or export the scanner data as TXT or CSV.')
    return text
  } catch (error) {
    const message = String(error?.message || '')
    if (/more than 100 pages|No selectable text/.test(message)) throw new Error(message)
    throw new Error('We could not read this PDF. It may be damaged or password-protected. Try a text-based scanner export instead.')
  } finally {
    if (loadingTask) await loadingTask.destroy().catch(() => {})
  }
}

function response(config, data, status = 200) {
  return { config, data, status, statusText: status === 200 ? 'OK' : 'Created', headers: {}, request: null }
}

function failure(config, status, message) {
  const error = new Error(message)
  error.config = config
  error.response = { config, data: { message }, status, statusText: 'Demo request failed', headers: {}, request: null }
  error.isAxiosError = true
  return Promise.reject(error)
}

function requestBody(config) {
  if (typeof config.data !== 'string') return config.data || {}
  try { return JSON.parse(config.data) } catch { return {} }
}

function pathFor(config) {
  const url = new URL(config.url || '/', window.location.origin)
  return url.pathname.replace(/^\/api\/v1(?=\/|$)/, '').replace(/\/$/, '') || '/'
}

function addReport(report) {
  const rows = readList('reports')
  writeList('reports', newestFirst([report, ...rows.filter((row) => row.id !== report.id)]))
  return report
}

async function reportFromFile(file) {
  if (!file) throw new Error('Choose a scanner export file first.')
  if (file.size > 20 * 1024 * 1024) throw new Error('This file is larger than the 20 MB upload limit.')
  const filename = String(file.name || 'scanner-export.txt')
  const extension = filename.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || ''
  const isPdf = extension === 'pdf' || file.type === 'application/pdf'
  const binaryExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'zip', 'gz', 'exe', 'doc', 'docx', 'xls', 'xlsx'])
  if ((!isPdf && binaryExtensions.has(extension)) || (!isPdf && file.type && !/^(text\/|application\/(json|xml|octet-stream))/i.test(file.type))) throw new Error('Use a TXT, CSV, JSON, XML, LOG, or text-based PDF scanner export.')
  const text = isPdf ? await extractPdfText(file) : typeof file.text === 'function' ? await file.text() : await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('The selected file could not be read.'))
    reader.readAsText(file)
  })
  if (text.includes('\u0000')) throw new Error('This file does not look like a text scanner export.')
  const codes = [...new Set([...text.toUpperCase().matchAll(/\b([PCBU])\s*([0-3])\s*([A-F0-9])\s*([A-F0-9])\s*([A-F0-9])\b/g)].map((match) => match.slice(1).join('')))]
  const createdAt = new Date().toISOString()
  const vehicleMake = inferVehicleMake(`${filename} ${text.slice(0, 5000)}`)
  const diagnostics = codes.map((code) => enrichDiagnostic({
    code,
    severity: 'UNKNOWN',
    title: null,
    description: 'This code was extracted from the uploaded text. No verified diagnostic provider is connected in this browser demo.',
    causes: [],
    drivingRecommendation: 'Have the code and vehicle symptoms verified by a qualified technician before making repair decisions.',
    confidence: null,
    source: null,
  }, { make: vehicleMake }))
  return addReport({
    id: newId(),
    fileName: filename,
    vehicleName: vehicleMake ? `${vehicleMake} · model/year not provided` : 'Vehicle details not provided',
    vehicleMake,
    createdAt,
    diagnostics,
    healthScore: null,
    summary: `${codes.length} diagnostic code${codes.length === 1 ? '' : 's'} extracted from the uploaded text. The codes are not verified repair diagnoses.`,
  })
}

function sampleReport() {
  const existing = readList('reports').find((row) => row.demoSample)
  if (existing) return existing
  return addReport({
    id: newId(),
    fileName: 'sample-scanner-export.txt',
    vehicleName: 'Example vehicle (sample)',
    createdAt: new Date().toISOString(),
    diagnostics: ['P0300', 'P0171'].map((code) => enrichDiagnostic({
      code,
      severity: 'UNKNOWN',
      title: null,
      description: 'Sample code detected in synthetic example text. No repair meaning or severity is asserted.',
      causes: [],
      drivingRecommendation: 'Use this sample to explore the interface; it is not a real vehicle scan.',
      confidence: null,
      source: 'Synthetic sample file',
    })),
    healthScore: null,
    summary: 'Synthetic example only: two DTC-shaped codes were extracted. No verified vehicle diagnosis is included.',
    demoSample: true,
  })
}

function textPdf(report) {
  const lines = [
    'OBD AI DIAGNOSTIC CENTER - BROWSER DEMO',
    `File: ${report.fileName || 'Scanner export'}`,
    `Vehicle: ${report.vehicleName || 'Not provided'}`,
    `Date: ${new Date(report.createdAt || Date.now()).toLocaleString()}`,
    `Codes extracted: ${(report.diagnostics || []).length}`,
    '',
    'IMPORTANT: Extracted codes are not verified diagnoses or repair instructions.',
    ...((report.diagnostics || []).flatMap((item) => {
      const finding = enrichDiagnostic(item, { make: report.vehicleMake || inferVehicleMake(`${report.fileName || ''} ${report.vehicleName || ''}`) })
      return [
        `Code: ${finding.code} (UNVERIFIED)`,
        finding.title || 'Reference not available',
        finding.description || 'No description is available.',
        ...(finding.causes?.length ? [`Possible causes: ${finding.causes.join('; ')}`] : []),
        ...(finding.nextStep ? [`Next step: ${finding.nextStep}`] : []),
        '',
      ]
    })),
    'This report was created locally in your browser. No account or server was used.',
  ].map((line) => String(line).normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').slice(0, 110))

  const pages = []
  while (lines.length) pages.push(lines.splice(0, 43))
  const objects = []
  const addObject = (value) => { objects.push(value); return objects.length }
  const pagesId = addObject('')
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const pageIds = pages.map((pageLines) => {
    const stream = ['BT', '/F1 10 Tf', '50 790 Td', '14 TL', ...pageLines.flatMap((line, index) => [`(${line.replace(/([\\()])/g, '\\$1')}) Tj`, ...(index < pageLines.length - 1 ? ['T*'] : [])]), 'ET'].join('\n')
    const streamId = addObject(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`)
    return addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`)
  })
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function resetDemoData() {
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    memory[name] = []
    try { localStorage.removeItem(key) } catch { /* Ignore unavailable browser storage. */ }
  })
}

export async function demoAdapter(config) {
  const method = (config.method || 'get').toLowerCase()
  const path = pathFor(config)
  const body = requestBody(config)

  if (method === 'get' && path === '/auth/me') return response(config, { id: 'local-demo', displayName: 'Guest demo', email: 'demo@local.invalid', role: 'USER' })
  if (method === 'get' && path === '/subscriptions/me') return response(config, { planCode: 'DEMO', scansUsed: readList('reports').length, scanLimit: -1 })
  if (method === 'get' && path === '/reports') {
    const params = config.params || {}
    const rows = newestFirst(readList('reports'))
    return response(config, params.limit ? rows.slice(0, Number(params.limit)) : rows)
  }
  if (method === 'get' && /^\/reports\/[^/]+\/pdf$/.test(path)) {
    const reportId = path.split('/')[2]
    const report = readList('reports').find((item) => item.id === reportId)
    return report ? response(config, textPdf(report)) : failure(config, 404, 'Report not found in this browser.')
  }
  if (method === 'get' && /^\/reports\/[^/]+$/.test(path)) {
    const reportId = path.split('/')[2]
    const report = readList('reports').find((item) => item.id === reportId)
    return report ? response(config, report) : failure(config, 404, 'Report not found in this browser.')
  }
  if (method === 'get' && path === '/vehicles') return response(config, readList('vehicles'))
  if (method === 'get' && /^\/vehicles\/decode-vin\//.test(path)) return failure(config, 503, 'VIN decoding is not connected in this browser demo. You can enter vehicle details manually.')
  if (method === 'get' && /^\/vehicles\/[^/]+\/maintenance$/.test(path)) {
    const vehicleId = path.split('/')[2]
    return response(config, readList('maintenance').filter((item) => item.vehicleId === vehicleId))
  }
  if (method === 'get' && path === '/notifications') return response(config, readList('notifications'))
  if (method === 'post' && path === '/auth/logout') return response(config, {})
  if (method === 'post' && path === '/demo/sample') return response(config, sampleReport(), 201)
  if (method === 'post' && path === '/scans/upload') {
    const file = config.data instanceof FormData ? config.data.get('file') : null
    try { return response(config, await reportFromFile(file), 201) } catch (error) { return failure(config, 400, error.message) }
  }
  if (method === 'post' && path === '/vehicles') {
    const vehicle = { ...body, id: newId(), reportCount: 0, createdAt: new Date().toISOString() }
    writeList('vehicles', [vehicle, ...readList('vehicles')])
    return response(config, vehicle, 201)
  }
  if (method === 'post' && /^\/vehicles\/[^/]+\/maintenance$/.test(path)) {
    const vehicleId = path.split('/')[2]
    const item = { ...body, id: newId(), vehicleId, createdAt: new Date().toISOString() }
    writeList('maintenance', [item, ...readList('maintenance')])
    return response(config, item, 201)
  }
  if (method === 'post' && path === '/ai/assistant') {
    const latest = newestFirst(readList('reports'))[0]
    const codes = latest?.diagnostics?.map((item) => item.code).join(', ')
    return response(config, { answer: `This no-login demo does not use an AI service. ${codes ? `Your latest saved scan contains extracted code${latest.diagnostics.length === 1 ? '' : 's'} ${codes}. ` : 'There are no saved scans yet. '}These codes are unverified; use a connected diagnostic provider and a qualified technician for vehicle-specific interpretation.` })
  }
  if (method === 'post' && /^\/notifications\/[^/]+\/read$/.test(path)) {
    const id = path.split('/')[2]
    writeList('notifications', readList('notifications').map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item))
    return response(config, {})
  }
  if (method === 'put' && /^\/vehicles\/[^/]+$/.test(path)) {
    const id = path.split('/')[2]
    const vehicles = readList('vehicles').map((item) => item.id === id ? { ...item, ...body } : item)
    writeList('vehicles', vehicles)
    return response(config, vehicles.find((item) => item.id === id) || {})
  }
  if (method === 'delete' && /^\/reports\/[^/]+$/.test(path)) {
    const id = path.split('/')[2]
    writeList('reports', readList('reports').filter((item) => item.id !== id))
    return response(config, {})
  }
  if (method === 'delete' && /^\/vehicles\/[^/]+$/.test(path)) {
    const id = path.split('/')[2]
    writeList('vehicles', readList('vehicles').filter((item) => item.id !== id))
    writeList('maintenance', readList('maintenance').filter((item) => item.vehicleId !== id))
    return response(config, {})
  }
  if (method === 'delete' && /^\/notifications\/[^/]+$/.test(path)) {
    const id = path.split('/')[2]
    writeList('notifications', readList('notifications').filter((item) => item.id !== id))
    return response(config, {})
  }
  return failure(config, 404, 'This action is not available in the browser demo.')
}
