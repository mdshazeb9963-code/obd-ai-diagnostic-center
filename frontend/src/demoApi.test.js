import { beforeEach, describe, expect, it } from 'vitest'
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
