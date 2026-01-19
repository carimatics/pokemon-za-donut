/**
 * WGSL Compute Shaders for Recipe Calculation
 *
 * These shaders perform parallel computation of flavor totals
 * and recipe validation on the GPU.
 */

/**
 * Compute shader for calculating flavor totals
 *
 * Input buffer layout (per berry):
 * - berryId: u32
 * - spicy: f32
 * - dry: f32
 * - sweet: f32
 * - bitter: f32
 * - sour: f32
 * - count: u32 (available quantity)
 * - padding: u32 (for alignment)
 *
 * Recipe buffer layout (per recipe):
 * - berryIndices: array<u32, MAX_SLOTS> (indices into berry buffer)
 * - slotCount: u32 (number of berries used)
 * - padding: array<u32, 3> (for alignment)
 *
 * Output buffer layout (per recipe):
 * - totalSpicy: f32
 * - totalDry: f32
 * - totalSweet: f32
 * - totalBitter: f32
 * - totalSour: f32
 * - isValid: u32 (1 if valid, 0 if invalid)
 * - padding: array<u32, 2> (for alignment)
 */
export const flavorCalculationShader = /* wgsl */ `
struct Berry {
  berryId: u32,
  spicy: f32,
  fresh: f32,
  sweet: f32,
  bitter: f32,
  sour: f32,
  count: u32,
  padding: u32,
}

struct Recipe {
  berryIndices: array<u32, 8>,
  slotCount: u32,
  padding: array<u32, 3>,
}

struct FlavorResult {
  totalSpicy: f32,
  totalFresh: f32,
  totalSweet: f32,
  totalBitter: f32,
  totalSour: f32,
  isValid: u32,
  padding: array<u32, 2>,
}

struct RequiredFlavors {
  spicy: f32,
  fresh: f32,
  sweet: f32,
  bitter: f32,
  sour: f32,
  padding: array<u32, 3>,
}

@group(0) @binding(0) var<storage, read> berries: array<Berry>;
@group(0) @binding(1) var<storage, read> recipes: array<Recipe>;
@group(0) @binding(2) var<storage, read> required: RequiredFlavors;
@group(0) @binding(3) var<storage, read_write> results: array<FlavorResult>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let recipeIndex = global_id.x;

  // Bounds check
  if (recipeIndex >= arrayLength(&recipes)) {
    return;
  }

  let recipe = recipes[recipeIndex];
  var result: FlavorResult;

  // Initialize totals
  result.totalSpicy = 0.0;
  result.totalFresh = 0.0;
  result.totalSweet = 0.0;
  result.totalBitter = 0.0;
  result.totalSour = 0.0;
  result.isValid = 1u;

  // Calculate flavor totals
  for (var i = 0u; i < recipe.slotCount; i = i + 1u) {
    let berryIndex = recipe.berryIndices[i];

    // Bounds check for berry index
    if (berryIndex >= arrayLength(&berries)) {
      result.isValid = 0u;
      break;
    }

    let berry = berries[berryIndex];

    result.totalSpicy = result.totalSpicy + berry.spicy;
    result.totalFresh = result.totalFresh + berry.fresh;
    result.totalSweet = result.totalSweet + berry.sweet;
    result.totalBitter = result.totalBitter + berry.bitter;
    result.totalSour = result.totalSour + berry.sour;
  }

  // Validate against required flavors (only if still valid)
  if (result.isValid == 1u) {
    if (result.totalSpicy < required.spicy ||
        result.totalFresh < required.fresh ||
        result.totalSweet < required.sweet ||
        result.totalBitter < required.bitter ||
        result.totalSour < required.sour) {
      result.isValid = 0u;
    }
  }

  // Write result
  results[recipeIndex] = result;
}
`

/**
 * Compute shader for batch validation of berry combinations
 *
 * This shader checks if a set of berry combinations meet the required flavors
 * without calculating exact totals (faster for initial filtering).
 */
export const validationShader = /* wgsl */ `
struct Berry {
  berryId: u32,
  spicy: f32,
  fresh: f32,
  sweet: f32,
  bitter: f32,
  sour: f32,
  count: u32,
  padding: u32,
}

struct Combination {
  berryIndices: array<u32, 8>,
  slotCount: u32,
  padding: array<u32, 3>,
}

struct RequiredFlavors {
  spicy: f32,
  fresh: f32,
  sweet: f32,
  bitter: f32,
  sour: f32,
  padding: array<u32, 3>,
}

@group(0) @binding(0) var<storage, read> berries: array<Berry>;
@group(0) @binding(1) var<storage, read> combinations: array<Combination>;
@group(0) @binding(2) var<storage, read> required: RequiredFlavors;
@group(0) @binding(3) var<storage, read_write> isValid: array<u32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let combIndex = global_id.x;

  // Bounds check
  if (combIndex >= arrayLength(&combinations)) {
    return;
  }

  let combination = combinations[combIndex];
  var valid = 1u;

  // Quick validation: sum all flavors and check against requirements
  var totalSpicy = 0.0;
  var totalFresh = 0.0;
  var totalSweet = 0.0;
  var totalBitter = 0.0;
  var totalSour = 0.0;

  for (var i = 0u; i < combination.slotCount; i = i + 1u) {
    let berryIndex = combination.berryIndices[i];

    if (berryIndex >= arrayLength(&berries)) {
      valid = 0u;
      break;
    }

    let berry = berries[berryIndex];
    totalSpicy = totalSpicy + berry.spicy;
    totalFresh = totalFresh + berry.fresh;
    totalSweet = totalSweet + berry.sweet;
    totalBitter = totalBitter + berry.bitter;
    totalSour = totalSour + berry.sour;
  }

  // Check if meets requirements
  if (valid == 1u) {
    if (totalSpicy < required.spicy ||
        totalFresh < required.fresh ||
        totalSweet < required.sweet ||
        totalBitter < required.bitter ||
        totalSour < required.sour) {
      valid = 0u;
    }
  }

  isValid[combIndex] = valid;
}
`
