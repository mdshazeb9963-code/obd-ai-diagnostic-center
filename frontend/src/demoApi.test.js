import { beforeEach, describe, expect, it, vi } from 'vitest'

const pdfMock = vi.hoisted(() => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}))
vi.mock('pdfjs-dist/build/pdf.mjs', () => pdfMock)
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/pdf.worker.test.mjs' }))

import { demoAdapter, resetDemoData } from './demoApi.js'

const call = (method, url, data, params) => demoAdapter({ method, url, data, params })
const blobText = (blob) => typeof blob.text === 'function' ? blob.text() : new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = reject
  reader.readAsText(blob)
})

describe('browser demo data adapter', () => {
  beforeEach(() => {
    resetDemoData()
    localStorage.clear()
    pdfMock.getDocument.mockReset()
    pdfMock.GlobalWorkerOptions.workerSrc = ''
  })

  it('extracts codes from a local text upload, persists the report, and exports a PDF', async () => {
    const form = new FormData()
    form.append('file', new File(['Stored trouble codes: P0300, P0171, P0300'], 'scan.txt', { type: 'text/plain' }))
    const created = await call('post', '/scans/upload', form)

    expect(created.data.fileName).toBe('scan.txt')
    expect(created.data.diagnostics.map((item) => item.code)).toEqual(['P0300', 'P0171'])
    expect(created.data.diagnostics.every((item) => item.severity === 'UNKNOWN')).toBe(true)

    const listed = await call('get', '/reports')
    expect(listed.data).toHaveLength(1)
    const exported = await call('get', `/reports/${created.data.id}/pdf`)
    const pdf = await blobText(exported.data)
    expect(pdf).toContain('%PDF-1.4')
    expect(pdf).toContain('UNVERIFIED')
  })

  it('extracts DTCs from a selectable-text PDF locally', async () => {
    const page = {
      getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'Trouble codes:' }, { str: 'P 0 3 0 0' }, { str: 'P0' }, { str: '171' }] }),
      cleanup: vi.fn(),
    }
    const document = { numPages: 1, getPage: vi.fn().mockResolvedValue(page) }
    const task = { promise: Promise.resolve(document), destroy: vi.fn().mockResolvedValue() }
    pdfMock.getDocument.mockReturnValue(task)

    const form = new FormData()
    form.append('file', new File([new Uint8Array([37, 80, 68, 70])], 'diagnostic.pdf', { type: 'application/pdf' }))
    const created = await call('post', '/scans/upload', form)

    expect(pdfMock.GlobalWorkerOptions.workerSrc).toBe('/assets/pdf.worker.test.mjs')
    expect(pdfMock.getDocument).toHaveBeenCalledWith({ data: expect.any(Uint8Array), isEvalSupported: false })
    expect(created.data.fileName).toBe('diagnostic.pdf')
    expect(created.data.diagnostics.map((item) => item.code)).toEqual(['P0300', 'P0171'])
    expect(page.cleanup).toHaveBeenCalledOnce()
    expect(task.destroy).toHaveBeenCalledOnce()
  })

  it('explains that scanned image PDFs need OCR', async () => {
    const page = { getTextContent: vi.fn().mockResolvedValue({ items: [] }), cleanup: vi.fn() }
    pdfMock.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 1, getPage: async () => page }), destroy: vi.fn().mockResolvedValue() })
    const form = new FormData()
    form.append('file', new File([new Uint8Array([37, 80, 68, 70])], 'scanned.pdf', { type: 'application/pdf' }))

    await expect(call('post', '/scans/upload', form)).rejects.toThrow('No selectable text was found in this PDF. It may be a scanned image.')
  })

  it('saves vehicles and service notes in browser storage and removes them together', async () => {
    const created = await call('post', '/vehicles', JSON.stringify({ nickname: 'Daily', make: 'Honda', model: 'Civic', year: 2020 }))
    const vehicle = created.data
    expect((await call('get', '/vehicles')).data[0].nickname).toBe('Daily')

    await call('post', `/vehicles/${vehicle.id}/maintenance`, JSON.stringify({ title: 'Oil service', mileage: 50000 }))
    expect((await call('get', `/vehicles/${vehicle.id}/maintenance`)).data).toHaveLength(1)

    await call('delete', `/vehicles/${vehicle.id}`)
    expect((await call('get', '/vehicles')).data).toHaveLength(0)
    expect((await call('get', `/vehicles/${vehicle.id}/maintenance`)).data).toHaveLength(0)
  })

  it('loads only one synthetic sample report even when the sample action is clicked repeatedly', async () => {
    const first = await call('post', '/demo/sample')
    const second = await call('post', '/demo/sample')
    expect(first.data.id).toBe(second.data.id)
    expect(first.data.demoSample).toBe(true)
    expect((await call('get', '/reports')).data).toHaveLength(1)
  })
})
