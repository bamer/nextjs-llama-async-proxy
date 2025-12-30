# Tooltip System Quick Reference

## What is the Tooltip System?

The tooltip system provides instant help for every configuration parameter in the Model Config Dialog. Simply hover over any field or the info icon next to it to see detailed explanations, recommended values, and guidance on when to adjust settings.

## How to Use

1. Open the Model Config Dialog by clicking the gear icon on any model
2. Select a config category (Sampling, Memory, GPU, Advanced, LoRA, or Multimodal)
3. Hover your mouse over any field
4. Read the tooltip that appears

**Tip**: You can also hover over the ℹ️ (info) icon next to each field.

## Tooltip Sections

Each tooltip contains up to 4 sections:

### 📌 Title
- The parameter name
- Color: Blue (primary color)

### 📝 Description
- What the parameter does in plain language
- Clear and concise explanation

### ✅ Recommended Value
- Suggested values or ranges
- Default values included
- Color: Green (success color)

### ⚡ Effect on Model
- How changing this value affects model behavior
- What to expect from different values
- Color: Blue (info color)

### 🔧 When to Adjust
- Practical scenarios when you should change this setting
- Use cases for different values
- Color: Orange (warning color)

## Common Parameters

### Temperature
**Controls randomness**
- **0.0 - 0.5**: Very focused, predictable output
- **0.7 (default)**: Balanced creativity and coherence
- **1.0 - 2.0**: More creative, varied output
- **When to adjust**: Increase for creative writing, decrease for code or facts

### Top P
**Nucleus sampling - selects from most likely tokens**
- **0.1 - 0.5**: Very focused, less diverse
- **0.9 (default)**: Balanced
- **1.0**: Maximum diversity
- **When to adjust**: Decrease for focused content, increase for variety

### GPU Layers
**Controls how much model runs on GPU**
- **-1 (default)**: All possible layers on GPU (fastest)
- **0**: All on CPU (slowest)
- **1-20**: Partial offloading
- **When to adjust**: Decrease if you run out of VRAM, increase for speed

### Repeat Penalty
**Reduces repetitive content**
- **1.0**: No penalty
- **1.1 - 1.3**: Light penalty
- **1.5 - 2.0**: Strong penalty
- **When to adjust**: Increase when model loops or repeats

### Presence Penalty
**Encourages variety in topics**
- **0.0**: No penalty
- **0.5 - 1.0**: Moderate variety
- **1.5 - 2.0**: Strong variety
- **When to adjust**: Use to encourage new topics and vocabulary

## Category Reference

### Sampling Parameters
Control how the model generates text. These affect creativity, coherence, and variety.

**Key Parameters:**
- Temperature - Randomness
- Top K/Top P - Token selection
- Repeat Penalty - Prevent loops
- Presence/Frequency Penalty - Encourage variety

### Memory Parameters
Control how the model uses RAM and cache.

**Key Parameters:**
- Cache RAM - Memory allocation for KV cache
- MMap - Memory mapping (saves RAM)
- MLock - Lock in physical RAM (prevents swapping)

### GPU Parameters
Control GPU acceleration and layer offloading.

**Key Parameters:**
- GPU Layers - How many layers run on GPU
- Split Mode - How to split across multiple GPUs
- Tensor Split - VRAM allocation per GPU

### Advanced Parameters
Expert-level settings for performance and behavior.

**Key Parameters:**
- Context Shift - Handle very long inputs
- Custom Params - Pass custom settings
- Check Tensors - Validate model loading

### LoRA Parameters
Control LoRA (Low-Rank Adaptation) adapters for fine-tuning.

**Key Parameters:**
- LoRA Path - Path to LoRA adapter file
- Control Vector - Steer model behavior
- Model Draft - Speculative decoding with draft model

### Multimodal Parameters
Control vision and image processing capabilities.

**Key Parameters:**
- MMPROJ - Multimodal projection model (CLIP encoder)
- MMPROJ Offload - Run vision encoder on GPU
- Image Tokens - Min/max tokens per image

## Tips for Using Tooltips

1. **Start with Defaults**: Most default values work well for most use cases
2. **Change One at a Time**: Adjust parameters individually to understand effects
3. **Read Full Tooltip**: Check all sections for complete understanding
4. **Use Recommendations**: Follow suggested values when unsure
5. **Test Changes**: Try different values to see what works best

## Common Use Cases

### Creative Writing
- Temperature: 0.9 - 1.2
- Top P: 0.9 - 1.0
- Repeat Penalty: 1.1 - 1.2

### Code Generation
- Temperature: 0.1 - 0.4
- Top P: 0.7 - 0.9
- Repeat Penalty: 1.0 - 1.1

### Chat/Conversation
- Temperature: 0.6 - 0.8
- Top P: 0.9
- Presence Penalty: 0.3 - 0.5

### Factual Responses
- Temperature: 0.0 - 0.3
- Top P: 0.7 - 0.9
- Frequency Penalty: 0.0 - 0.3

## Performance Tuning

### Low VRAM (< 8GB)
- GPU Layers: 20-30
- MMap: Enabled
- KV Offload: Disabled

### Medium VRAM (8-16GB)
- GPU Layers: -1 (all)
- MMap: Disabled
- KV Offload: Enabled

### High VRAM (> 16GB)
- GPU Layers: -1 (all)
- MMap: Disabled
- KV Offload: Enabled
- Context: Maximum supported

## Getting Help

If you need more information:
- Read the full tooltip by hovering slowly over the field
- Check the recommended value section
- Follow the "When to Adjust" guidance
- Try tooltips on related parameters to understand interactions

## FAQ

**Q: The tooltip disappears too quickly!**
A: Move your mouse slowly over the field or icon. Tooltips stay visible while you're hovering.

**Q: Can I disable tooltips?**
A: Currently, tooltips are always available but only appear when you hover.

**Q: Why are some tooltips longer than others?**
A: Complex parameters need more explanation. All tooltips provide essential information.

**Q: How do I know if a value is good?**
A: Check the "Recommended Value" section and start with defaults.

**Q: What if I don't understand a tooltip?**
A: Start with the default value and experiment with small changes to see the effects.
