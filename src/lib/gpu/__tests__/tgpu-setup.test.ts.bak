/**
 * TypeGPU Setup Tests
 *
 * These tests verify that TypeGPU schemas and context management work correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { berrySchema, recipeSchema, requiredFlavorsSchema, flavorResultSchema } from '../tgpu-schemas'

describe('TypeGPU Schemas', () => {
  describe('berrySchema', () => {
    it('should be defined', () => {
      expect(berrySchema).toBeDefined()
      // TypeGPU schemas are functions that can be used to create buffers
      expect(typeof berrySchema).toBe('function')
    })
  })

  describe('recipeSchema', () => {
    it('should be defined', () => {
      expect(recipeSchema).toBeDefined()
      expect(typeof recipeSchema).toBe('function')
    })
  })

  describe('requiredFlavorsSchema', () => {
    it('should be defined', () => {
      expect(requiredFlavorsSchema).toBeDefined()
      expect(typeof requiredFlavorsSchema).toBe('function')
    })
  })

  describe('flavorResultSchema', () => {
    it('should be defined', () => {
      expect(flavorResultSchema).toBeDefined()
      expect(typeof flavorResultSchema).toBe('function')
    })
  })
})

describe('TypeGPU Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isTypeGPUSupported', () => {
    it('should return false when navigator.gpu is not available', async () => {
      const { isTypeGPUSupported } = await import('../tgpu-context')

      // Mock navigator.gpu as undefined
      Object.defineProperty(global.navigator, 'gpu', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await isTypeGPUSupported()
      expect(result).toBe(false)
    })

    it('should return false when requestAdapter returns null', async () => {
      const { isTypeGPUSupported } = await import('../tgpu-context')

      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
        writable: true,
        configurable: true,
      })

      const result = await isTypeGPUSupported()
      expect(result).toBe(false)
    })

    it('should return true when GPU is available', async () => {
      const { isTypeGPUSupported } = await import('../tgpu-context')

      const mockAdapter = {
        limits: {},
        features: new Set(),
      }

      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        },
        writable: true,
        configurable: true,
      })

      const result = await isTypeGPUSupported()
      expect(result).toBe(true)
    })
  })

  describe('isTypeGPUInitialized', () => {
    it('should return false initially', async () => {
      // Import fresh module
      const { isTypeGPUInitialized } = await import('../tgpu-context')
      expect(isTypeGPUInitialized()).toBe(false)
    })
  })

  describe('getGPUDeviceInfo', () => {
    it('should return device info', async () => {
      const { getGPUDeviceInfo } = await import('../tgpu-context')

      const info = getGPUDeviceInfo()

      expect(info).toHaveProperty('supported')
      expect(info).toHaveProperty('initialized')
      expect(typeof info.supported).toBe('boolean')
      expect(typeof info.initialized).toBe('boolean')
    })
  })

  describe('cleanupTypeGPU', () => {
    it('should not throw when cleaning up', async () => {
      const { cleanupTypeGPU } = await import('../tgpu-context')

      expect(() => cleanupTypeGPU()).not.toThrow()
    })
  })
})

describe('Schema Type Inference', () => {
  it('should export type inference helpers', async () => {
    const schemas = await import('../tgpu-schemas')

    // Verify that type exports exist (compile-time check)
    expect(schemas.berrySchema).toBeDefined()
    expect(schemas.recipeSchema).toBeDefined()
    expect(schemas.requiredFlavorsSchema).toBeDefined()
    expect(schemas.flavorResultSchema).toBeDefined()
  })

  it('should export SCHEMAS constant', async () => {
    const { SCHEMAS } = await import('../tgpu-schemas')

    expect(SCHEMAS).toBeDefined()
    expect(SCHEMAS.berry).toBeDefined()
    expect(SCHEMAS.recipe).toBeDefined()
    expect(SCHEMAS.requiredFlavors).toBeDefined()
    expect(SCHEMAS.flavorResult).toBeDefined()
  })

  it('should export GPU_CONSTANTS', async () => {
    const { GPU_CONSTANTS } = await import('../tgpu-schemas')

    expect(GPU_CONSTANTS).toBeDefined()
    expect(GPU_CONSTANTS.MAX_BERRY_SLOTS).toBe(8)
    expect(GPU_CONSTANTS.WORKGROUP_SIZE).toBe(64)
  })
})
