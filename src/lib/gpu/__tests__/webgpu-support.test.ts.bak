import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isWebGPUSupported, initializeGPU, cleanupGPU, getGPUInfo } from '../webgpu-support'

describe('webgpu-support', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
  })

  describe('isWebGPUSupported', () => {
    it('should return false when navigator.gpu is not available', async () => {
      // Mock navigator.gpu as undefined
      Object.defineProperty(global.navigator, 'gpu', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await isWebGPUSupported()
      expect(result).toBe(false)
    })

    it('should return false when requestAdapter returns null', async () => {
      // Mock navigator.gpu with requestAdapter returning null
      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
        writable: true,
        configurable: true,
      })

      const result = await isWebGPUSupported()
      expect(result).toBe(false)
    })

    it('should return true when GPU is available', async () => {
      // Mock navigator.gpu with valid adapter
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

      const result = await isWebGPUSupported()
      expect(result).toBe(true)
    })

    it('should return false when requestAdapter throws an error', async () => {
      // Mock navigator.gpu with requestAdapter throwing error
      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockRejectedValue(new Error('GPU error')),
        },
        writable: true,
        configurable: true,
      })

      const result = await isWebGPUSupported()
      expect(result).toBe(false)
    })

    it('should log appropriate messages', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      Object.defineProperty(global.navigator, 'gpu', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      await isWebGPUSupported()
      expect(consoleLogSpy).toHaveBeenCalledWith('[WebGPU] navigator.gpu not available')

      consoleLogSpy.mockRestore()
    })
  })

  describe('initializeGPU', () => {
    it('should throw error when navigator.gpu is not available', async () => {
      Object.defineProperty(global.navigator, 'gpu', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      await expect(initializeGPU()).rejects.toThrow('WebGPU is not supported in this browser')
    })

    it('should throw error when requestAdapter returns null', async () => {
      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
        writable: true,
        configurable: true,
      })

      await expect(initializeGPU()).rejects.toThrow('Failed to get GPU adapter')
    })

    it('should initialize GPU device successfully', async () => {
      const mockDevice = {
        addEventListener: vi.fn(),
        destroy: vi.fn(),
      }

      const mockAdapter = {
        requestDevice: vi.fn().mockResolvedValue(mockDevice),
        limits: {
          maxStorageBufferBindingSize: 1024,
          maxBufferSize: 2048,
          maxComputeWorkgroupStorageSize: 512,
          maxComputeInvocationsPerWorkgroup: 256,
        },
        features: new Set(),
      }

      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        },
        writable: true,
        configurable: true,
      })

      const deviceInfo = await initializeGPU()

      expect(deviceInfo).toBeDefined()
      expect(deviceInfo.adapter).toBe(mockAdapter)
      expect(deviceInfo.device).toBe(mockDevice)
      expect(deviceInfo.limits).toBe(mockAdapter.limits)
      expect(deviceInfo.features).toBe(mockAdapter.features)
      expect(mockDevice.addEventListener).toHaveBeenCalledWith('uncapturederror', expect.any(Function))
    })

    it('should log initialization success', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockDevice = {
        addEventListener: vi.fn(),
        destroy: vi.fn(),
      }

      const mockAdapter = {
        requestDevice: vi.fn().mockResolvedValue(mockDevice),
        limits: {
          maxStorageBufferBindingSize: 1024,
          maxBufferSize: 2048,
          maxComputeWorkgroupStorageSize: 512,
          maxComputeInvocationsPerWorkgroup: 256,
          maxComputeWorkgroupsPerDimension: 128,
        },
        features: new Set(),
      }

      Object.defineProperty(global.navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        },
        writable: true,
        configurable: true,
      })

      await initializeGPU()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[WebGPU] Initialized successfully',
        expect.objectContaining({
          maxBufferSize: 2048,
          maxStorageBufferBindingSize: 1024,
        }),
      )

      consoleLogSpy.mockRestore()
    })
  })

  describe('cleanupGPU', () => {
    it('should do nothing when deviceInfo is null', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      cleanupGPU(null)

      expect(consoleLogSpy).not.toHaveBeenCalled()
      consoleLogSpy.mockRestore()
    })

    it('should destroy device and log message', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockDevice = {
        destroy: vi.fn(),
      }

      const mockDeviceInfo = {
        device: mockDevice as unknown as GPUDevice,
        adapter: {} as GPUAdapter,
        limits: {} as GPUSupportedLimits,
        features: new Set() as GPUSupportedFeatures,
      }

      cleanupGPU(mockDeviceInfo)

      expect(mockDevice.destroy).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith('[WebGPU] Device destroyed')

      consoleLogSpy.mockRestore()
    })
  })

  describe('getGPUInfo', () => {
    it('should return GPU info from adapter', () => {
      const mockAdapter = {
        info: {
          vendor: 'NVIDIA',
          architecture: 'Ampere',
          description: 'GeForce RTX 3080',
        },
      } as unknown as GPUAdapter

      const mockDeviceInfo = {
        adapter: mockAdapter,
        device: {} as GPUDevice,
        limits: {} as GPUSupportedLimits,
        features: new Set() as GPUSupportedFeatures,
      }

      const info = getGPUInfo(mockDeviceInfo)

      expect(info.vendor).toBe('NVIDIA')
      expect(info.architecture).toBe('Ampere')
      expect(info.description).toBe('GeForce RTX 3080')
    })

    it('should return "Unknown" for missing info fields', () => {
      const mockAdapter = {
        info: {},
      } as unknown as GPUAdapter

      const mockDeviceInfo = {
        adapter: mockAdapter,
        device: {} as GPUDevice,
        limits: {} as GPUSupportedLimits,
        features: new Set() as GPUSupportedFeatures,
      }

      const info = getGPUInfo(mockDeviceInfo)

      expect(info.vendor).toBe('Unknown')
      expect(info.architecture).toBe('Unknown')
      expect(info.description).toBe('Unknown')
    })

    it('should return "Unknown" when info is undefined', () => {
      const mockAdapter = {} as GPUAdapter

      const mockDeviceInfo = {
        adapter: mockAdapter,
        device: {} as GPUDevice,
        limits: {} as GPUSupportedLimits,
        features: new Set() as GPUSupportedFeatures,
      }

      const info = getGPUInfo(mockDeviceInfo)

      expect(info.vendor).toBe('Unknown')
      expect(info.architecture).toBe('Unknown')
      expect(info.description).toBe('Unknown')
    })
  })
})
