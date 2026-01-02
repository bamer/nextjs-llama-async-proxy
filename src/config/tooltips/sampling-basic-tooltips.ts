import { TooltipContent } from "../tooltip-config.types";

export const samplingBasicTooltips: Record<string, TooltipContent> = {
  temperature: {
    title: "Temperature",
    description: "Controls randomness in token selection. Higher values make output more random and creative, lower values make it more deterministic and focused.",
    recommendedValue: "0.0 - 2.0 (default: 0.7)",
    effectOnModel: "Higher values (≥1.0) increase creativity but may reduce coherence. Lower values (≤0.5) produce more predictable, focused responses.",
    whenToAdjust: "Increase for creative writing or brainstorming. Decrease for code generation, factual responses, or when you need precise outputs.",
  },
  top_k: {
    title: "Top K",
    description: "Limits token sampling to the K most likely tokens. Prevents the model from selecting from very low probability tokens.",
    recommendedValue: "1 - 100 (default: 40)",
    effectOnModel: "Lower values (1-10) restrict output to very likely tokens, reducing diversity. Higher values (40-100) allow more varied vocabulary.",
    whenToAdjust: "Use lower values for more deterministic outputs. Increase when the model is too repetitive or needs more vocabulary variety.",
  },
  top_p: {
    title: "Top P (Nucleus Sampling)",
    description: "Nucleus sampling: samples from the smallest set of tokens whose cumulative probability exceeds P. Works with Top K to control diversity.",
    recommendedValue: "0.1 - 1.0 (default: 0.9)",
    effectOnModel: "Lower values (0.1-0.5) create more focused, less diverse outputs. Higher values (0.8-1.0) allow more creative, varied responses.",
    whenToAdjust: "Decrease for more focused, predictable outputs. Increase for creative tasks where variety is desired.",
  },
  min_p: {
    title: "Min P",
    description: "Sets a minimum probability threshold for token selection. Tokens below this probability are excluded.",
    recommendedValue: "0.0 - 0.5 (default: 0.05)",
    effectOnModel: "Filters out very low probability tokens, reducing generation of nonsensical content.",
    whenToAdjust: "Increase to filter out more low-probability tokens and improve output quality.",
  },
  repeat_last_n: {
    title: "Repeat Last N",
    description: "Number of last tokens to consider when applying repeat penalties.",
    recommendedValue: "0 - 2048 (default: 64)",
    effectOnModel: "Controls the sliding window for detecting repeated patterns. Larger windows catch more distant repetitions.",
    whenToAdjust: "Increase to detect longer-range repetitions. Decrease for short-term repetition control.",
  },
  repeat_penalty: {
    title: "Repeat Penalty",
    description: "Applies a penalty to tokens that appear in recent context, reducing repetition.",
    recommendedValue: "1.0 - 2.0 (default: 1.0)",
    effectOnModel: "Values >1.0 penalize repeated tokens, reducing loops. 1.0 disables penalty. Too high values can break flow.",
    whenToAdjust: "Increase when model repeats itself. Decrease if output becomes unnatural or fragmented.",
  },
  presence_penalty: {
    title: "Presence Penalty",
    description: "Penalizes tokens that have already appeared at all in the generated text, encouraging variety.",
    recommendedValue: "0.0 - 2.0 (default: 0)",
    effectOnModel: "Encourages the model to talk about new topics and vocabulary. Too high can make responses incoherent.",
    whenToAdjust: "Use to encourage diverse vocabulary and avoid stuck topics.",
  },
  frequency_penalty: {
    title: "Frequency Penalty",
    description: "Penalizes tokens based on how frequently they've appeared, not just presence.",
    recommendedValue: "0.0 - 2.0 (default: 0)",
    effectOnModel: "More aggressive than presence penalty, heavily penalizing frequently used words.",
    whenToAdjust: "When presence penalty isn't enough to reduce word repetition.",
  },
  seed: {
    title: "Seed",
    description: "Random seed for generation. -1 uses random seed.",
    recommendedValue: "-1 or positive integer (default: -1)",
    effectOnModel: "Same seed with same settings produces identical output.",
    whenToAdjust: "Set for reproducible outputs during testing or debugging.",
  },
};
