/**
 * TypeGPU Context Management
 *
 * This module manages the TypeGPU root context and provides utilities
 * for GPU device initialization and resource management.
 */

import tgpu from 'typegpu'

// Type for TypeGPU root context
type TgpuRoot = Awaited<ReturnType<typeof tgpu.init>>

let rootContext: TgpuRoot | null = null

/**
 * Initialize TypeGPU context
 *
 * This should be called once at application startup or when GPU is needed.
 *
 * @returns TypeGPU root context
 * @throws Error if WebGPU is not supported or initialization fails
 */
export async function initializeTypeGPU(): Promise<TgpuRoot> {
  if (rootContext) {
    return rootContext
  }

  try {
    // Initialize TypeGPU without canvas (for compute-only usage)
    rootContext = await tgpu.init()

    console.log('[TypeGPU] Initialized successfully')
    return rootContext
  } catch (error) {
    console.error('[TypeGPU] Initialization failed:', error)
    throw new Error('Failed to initialize TypeGPU')
  }
}

/**
 * Get the current TypeGPU root context
 *
 * @returns Root context or null if not initialized
 */
export function getTypeGPUContext(): TgpuRoot | null {
  return rootContext
}

/**
 * Check if TypeGPU is initialized
 */
export function isTypeGPUInitialized(): boolean {
  return rootContext !== null
}

/**
 * Clean up TypeGPU resources
 *
 * Call this when you're done using GPU resources.
 */
export function cleanupTypeGPU(): void {
  if (rootContext) {
    try {
      // TypeGPU handles cleanup automatically when context is destroyed
      rootContext = null
      console.log('[TypeGPU] Context cleaned up')
    } catch (error) {
      console.error('[TypeGPU] Cleanup error:', error)
    }
  }
}

/**
 * Check if WebGPU is supported (TypeGPU wrapper)
 *
 * @returns Promise<boolean> indicating WebGPU support
 */
export async function isTypeGPUSupported(): Promise<boolean> {
  try {
    if (!navigator.gpu) {
      return false
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Get GPU device information
 *
 * Requires TypeGPU to be initialized first.
 */
export function getGPUDeviceInfo(): {
  supported: boolean
  initialized: boolean
  adapterInfo?: {
    vendor: string
    architecture: string
  }
} {
  const supported = 'gpu' in navigator
  const initialized = isTypeGPUInitialized()

  const info: ReturnType<typeof getGPUDeviceInfo> = {
    supported,
    initialized,
  }

  // TypeGPU exposes device information through the root context
  // This can be extended based on TypeGPU's API

  return info
}
