# Models Page - Icons Guide

## Column Icons & Meanings

### 📄 Name

**Icon**: Document file
**Meaning**: Model name/filename
**Sort**: Alphabetical (A→Z)
**Use case**: Find models by name quickly

### ⭐ Status

**Icon**: Star/state indicator
**Meaning**: Model load status
**Sort**: loaded → loading → unloaded → error
**Use case**: Group models by availability

### 🏗️ Arch

**Icon**: Construction/building
**Meaning**: Model architecture type
**Sort**: Alphabetical (LLM, Transformer, etc.)
**Use case**: Find models by type

### #️⃣ Params

**Icon**: Hash/number symbol
**Meaning**: Parameter count
**Sort**: Numeric (1B → 70B)
**Use case**: Find models by size tier

### 📊 Quant

**Icon**: Bar chart/data
**Meaning**: Quantization level
**Sort**: Alphabetical (Q4, Q8, FP16, etc.)
**Use case**: Find models by precision

### 📈 Ctx

**Icon**: Graph/upward trend
**Meaning**: Context window size
**Sort**: Numeric (512 → 32K)
**Use case**: Find models by token capacity

### 📐 Embed

**Icon**: Geometric/measure
**Meaning**: Embedding dimension size
**Sort**: Numeric (768 → 4096)
**Use case**: Find by embedding capacity

### 🧱 Blocks

**Icon**: Building blocks/bricks
**Meaning**: Number of transformer blocks
**Sort**: Numeric (12 → 80)
**Use case**: Find by layer count

### 👁️ Heads

**Icon**: Eyes/vision
**Meaning**: Attention head count
**Sort**: Numeric (8 → 128)
**Use case**: Find by attention complexity

### 💾 Size

**Icon**: Disk/storage
**Meaning**: File size on disk
**Sort**: Numeric (512MB → 70GB)
**Use case**: Find by storage requirement

### ⚙️ Actions

**Icon**: Gear/settings
**Meaning**: Available actions for model
**Sort**: By status (load → loading → unload)
**Use case**: Group by what you can do

---

## Quick Scan Tips

**Want to find large models?**
→ Click 💾 Size header (descending ↓)

**Want to find available models?**
→ Click ⭐ Status header (ascending ↑)

**Want models by tier?**
→ Click #️⃣ Params header

**Want to load something?**
→ Click ⚙️ Actions header (sees unloaded first)

---

## Icon Design Philosophy

Each icon represents the column's purpose:

- 📄 = Text/name data
- ⭐ = Status/state
- 🏗️ = Technical architecture
- #️⃣ = Numerical data
- 📊 = Quantitative data
- 📈 = Growth/capacity
- 📐 = Measurement/dimension
- 🧱 = Building blocks/layers
- 👁️ = Attention/heads
- 💾 = Storage/disk
- ⚙️ = Actions/operations

---

## Visual Learning

```
Quick Column Identification:

Top Row (Names & Basics):
📄 Name | ⭐ Status | 🏗️ Arch | #️⃣ Params

Middle Row (Model Properties):
📊 Quant | 📈 Ctx | 📐 Embed | 🧱 Blocks

Right Side (Stats & Actions):
👁️ Heads | 💾 Size | ⚙️ Actions
```

---

## Sort Indicators

When you click a header:

- **↑** = Ascending order (A→Z, 0→9)
- **↓** = Descending order (Z→A, 9→0)
- **No indicator** = Not currently sorted

Example:

```
📄 Name ↑      ← Sorted A to Z
⭐ Status      ← Not sorted
🏗️ Arch        ← Not sorted
💾 Size ↓      ← Sorted largest first
```

---

## Keyboard Navigation

```
Tab     → Move between columns
Click   → Sort by that column
Click   → Reverse sort order
```

---

## Emoji Consistency

All icons are **single emoji** characters:

- Easy to scan
- Consistent styling
- Works on all devices
- Professional appearance
- No text overlap

---

**Pro Tip**: Use icons + text together for fastest column identification!
