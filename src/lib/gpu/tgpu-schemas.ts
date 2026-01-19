/**
 * TypeGPU Schema Definitions for Recipe Finder
 *
 * These schemas define the data structures for GPU computation using TypeGPU.
 * TypeGPU provides type safety and automatic buffer management.
 */

import * as d from 'typegpu/data'

/**
 * Berry data structure for GPU
 *
 * Represents a single berry with its flavor values and available count.
 */
export const berrySchema = d.struct({
  berryId: d.u32,
  spicy: d.f32,
  fresh: d.f32,
  sweet: d.f32,
  bitter: d.f32,
  sour: d.f32,
  count: d.u32,
  padding: d.u32, // For 32-byte alignment
})

/**
 * Recipe data structure for GPU
 *
 * Represents a recipe as indices into the berry array.
 * Maximum 8 berry slots supported.
 */
export const recipeSchema = d.struct({
  berryIndices: d.arrayOf(d.u32, 8),
  slotCount: d.u32,
  padding: d.arrayOf(d.u32, 3), // For alignment
})

/**
 * Required flavors structure for GPU
 *
 * Specifies the minimum flavor values that a recipe must meet.
 */
export const requiredFlavorsSchema = d.struct({
  spicy: d.f32,
  fresh: d.f32,
  sweet: d.f32,
  bitter: d.f32,
  sour: d.f32,
  padding: d.arrayOf(d.u32, 3), // For alignment
})

/**
 * Result data structure for GPU
 *
 * Stores the computed flavor totals and validation status for a recipe.
 */
export const flavorResultSchema = d.struct({
  totalSpicy: d.f32,
  totalFresh: d.f32,
  totalSweet: d.f32,
  totalBitter: d.f32,
  totalSour: d.f32,
  isValid: d.u32, // 1 if valid, 0 if invalid
  padding: d.arrayOf(d.u32, 2), // For alignment
})

/**
 * Type inference helpers
 *
 * These types allow TypeScript to infer the data types from the schemas.
 */
export type BerryData = d.Infer<typeof berrySchema>
export type RecipeData = d.Infer<typeof recipeSchema>
export type RequiredFlavorsData = d.Infer<typeof requiredFlavorsSchema>
export type FlavorResultData = d.Infer<typeof flavorResultSchema>

/**
 * Schema validation and metadata
 */
export const SCHEMAS = {
  berry: berrySchema,
  recipe: recipeSchema,
  requiredFlavors: requiredFlavorsSchema,
  flavorResult: flavorResultSchema,
} as const

/**
 * Constants for GPU computation
 */
export const GPU_CONSTANTS = {
  MAX_BERRY_SLOTS: 8,
  WORKGROUP_SIZE: 64,
} as const
