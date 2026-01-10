# Quick Fix Guide - Top 4 Critical Bugs

## Bug #1: formatBytes() Missing Decimal (5 tests fail)

**File**: `server.js`, line 278-285

**Current**:

```javascript
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
```

**Fix** (1 line change):

```javascript
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i]; // Remove parseFloat()
}
```

**Why**: `parseFloat("512.0")` returns `512`, losing the trailing zero. `.toFixed(1)` already returns a string.

---

## Bug #2: extractArchitecture() Wrong Fallback (2 tests fail)

**File**: `server.js`, line 210-246

**Current**:

```javascript
function extractArchitecture(filename) {
  // ... patterns ...
  for (const p of patterns) {
    if (p.regex.test(lower)) return p.name;
  }

  const firstWord = filename
    .split(/[-_\s]/)[0]
    .replace(/\d+$/, "")
    .toLowerCase();
  if (firstWord.length > 3) return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

  return "LLM";
}
```

**Fix** (simplify fallback):

```javascript
function extractArchitecture(filename) {
  // ... patterns ...
  for (const p of patterns) {
    if (p.regex.test(lower)) return p.name;
  }

  // Always return "LLM" for unknown architectures
  return "LLM";
}
```

**Why**: The fallback logic tries to parse unknown filenames which creates names like "Xyzabc123.gguf" instead of "LLM".

---

## Bug #3: extractQuantization() GPT-OSS Regex (1 test fails)

**File**: `server.js`, line 261-276

**Current**:

```javascript
function extractQuantization(filename) {
  const endMatch = filename.match(
    /[-_](Q[0-9]+(?:_[A-Za-z0-9]+)+)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/
  );
  // ... rest ...
}
```

**Fix** (first regex change):

```javascript
function extractQuantization(filename) {
  const endMatch = filename.match(
    /[-_](Q[0-9]+[_A-Z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/i
  );
  if (endMatch) return endMatch[1].toUpperCase();
  // ... rest unchanged ...
}
```

**Why**: The `+` quantifier requires `_[A-Za-z0-9]+` (at least one part after underscore), which fails on `Q8_0`. The fix allows 0+ parts with `*`.

---

## Bug #4: models:scan DB Query in Loop (HUGE perf issue)

**File**: `server.js`, line 391-463

**Current** (line 425-450):

```javascript
const modelFiles = findModelFiles(modelsDir);
console.log("[DEBUG] Found model files:", modelFiles.length);

for (const fullPath of modelFiles) {
  const fileName = path.basename(fullPath);
  const existing = db.getModels().find(m => m.model_path === fullPath);  // ← CALLED EVERY ITERATION!
  if (!existing) {
    // ...
```

**Fix** (3 line change):

```javascript
const modelFiles = findModelFiles(modelsDir);
console.log("[DEBUG] Found model files:", modelFiles.length);
const existingModels = db.getModels();  // ← MOVE OUTSIDE LOOP

for (const fullPath of modelFiles) {
  const fileName = path.basename(fullPath);
  const existing = existingModels.find(m => m.model_path === fullPath);  // ← USE CACHED LIST
  if (!existing) {
    // ...
```

**Why**: Calling `db.getModels()` for each file is O(n²) complexity. With 1000 files = 1000 DB queries.

---

## Testing Your Fixes

```bash
# Run tests (should see 9 passing previously failing tests)
pnpm test

# Run linting
pnpm lint:fix

# Check specific test
pnpm test -- __tests__/server/metadata.test.js
```

---

## Remaining Issues (Not Critical)

After fixing these 4, the remaining issues are:

- **Memory leaks** in component event binding
- **Performance** in metrics collection
- **UX bugs** (focus loss, scroll position)
- **Code quality** (line lengths, unused vars)

See `CODEBASE_ANALYSIS.md` for full details.
