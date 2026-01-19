/**
 * WebGPU Support Detection and Initialization
 *
 * This module provides utilities for detecting WebGPU support
 * and initializing GPU resources for recipe computation.
 */

export interface GPUDeviceInfo {
  adapter: GPUAdapter
  device: GPUDevice
  limits: GPUSupportedLimits
  features: GPUSupportedFeatures
}

/**
 * Check if WebGPU is supported in the current browser
 */
export async function isWebGPUSupported(): Promise<boolean> {
  try {
    if (!navigator.gpu) {
      console.log('[WebGPU] navigator.gpu not available')
      return false
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      console.log('[WebGPU] Failed to get GPU adapter')
      return false
    }

    console.log('[WebGPU] Supported')
    return true
  } catch (error) {
    console.error('[WebGPU] Support check failed:', error)
    return false
  }
}

/**
 * Initialize WebGPU device and adapter
 * @throws Error if WebGPU is not supported or initialization fails
 */
export async function initializeGPU(): Promise<GPUDeviceInfo> {
  if (!navigator.gpu) {
    throw new Error('WebGPU is not supported in this browser')
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('Failed to get GPU adapter')
  }

  // Request device with required features
  const device = await adapter.requestDevice({
    requiredFeatures: [],
    requiredLimits: {
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      maxBufferSize: adapter.limits.maxBufferSize,
      maxComputeWorkgroupStorageSize: adapter.limits.maxComputeWorkgroupStorageSize,
      maxComputeInvocationsPerWorkgroup: adapter.limits.maxComputeInvocationsPerWorkgroup,
    },
  })

  // Set up error handling
  device.addEventListener('uncapturederror', (event: GPUUncapturedErrorEvent) => {
    console.error('[WebGPU] Uncaptured error:', event.error)
  })

  const deviceInfo: GPUDeviceInfo = {
    adapter,
    device,
    limits: adapter.limits,
    features: adapter.features,
  }

  console.log('[WebGPU] Initialized successfully', {
    maxBufferSize: deviceInfo.limits.maxBufferSize,
    maxStorageBufferBindingSize: deviceInfo.limits.maxStorageBufferBindingSize,
    maxComputeWorkgroupsPerDimension: deviceInfo.limits.maxComputeWorkgroupsPerDimension,
  })

  return deviceInfo
}

/**
 * Clean up GPU resources
 */
export function cleanupGPU(deviceInfo: GPUDeviceInfo | null): void {
  if (deviceInfo?.device) {
    deviceInfo.device.destroy()
    console.log('[WebGPU] Device destroyed')
  }
}

/**
 * Get human-readable GPU info for debugging
 */
export function getGPUInfo(deviceInfo: GPUDeviceInfo): {
  vendor: string
  architecture: string
  description: string
} {
  const { adapter } = deviceInfo
  const info = adapter.info || {}

  return {
    vendor: info.vendor || 'Unknown',
    architecture: info.architecture || 'Unknown',
    description: info.description || 'Unknown',
  }
}
