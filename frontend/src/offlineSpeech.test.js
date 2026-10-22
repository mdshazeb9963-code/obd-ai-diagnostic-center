import { describe, expect, it } from 'vitest'
import { offlineSpeechText, supportsOfflineSpeech } from './offlineSpeech.js'

const bundledCodes = [
  'P1603', 'P1604', 'P1605', 'C1241', 'C1256', 'C1268', 'C1452',
  'B1653', 'B1656', 'B1441', 'B1442', 'B1443', 'B1497', 'U1117', 'B2312',
]

describe('offline speech guide pack', () => {
  it('has a non-empty guide for every listed code in each bundled language', () => {
    for (const language of ['hi', 'hi-Latn', 'ur', 'te']) {
      for (const code of bundledCodes) {
        expect(supportsOfflineSpeech(code, language), `${language} ${code}`).toBe(true)
        expect(offlineSpeechText(code, language), `${language} ${code}`).toMatch(new RegExp(code.split('').join('\\s+')))
      }
    }
  })

  it('reports missing guides instead of inventing a translation', () => {
    expect(supportsOfflineSpeech('P0300', 'hi')).toBe(false)
    expect(offlineSpeechText('P0300', 'hi')).toBeNull()
    expect(supportsOfflineSpeech('P0300', 'en')).toBe(true)
  })
})
