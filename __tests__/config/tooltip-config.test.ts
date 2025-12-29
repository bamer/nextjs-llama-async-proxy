import { describe, it, expect } from "@jest/globals";
import { getTooltipContent, tooltipConfig } from "@/config/tooltip-config";
import { ConfigType } from "@/components/ui/ModelConfigDialog";

describe("Tooltip Configuration", () => {
  describe("getTooltipContent", () => {
    it("should return tooltip content for valid sampling parameters", () => {
      const result = getTooltipContent("sampling", "temperature");

      expect(result).toBeDefined();
      expect(result?.title).toBe("Temperature");
      expect(result?.description).toContain("randomness");
      expect(result?.recommendedValue).toContain("0.7");
    });

    it("should return tooltip content for valid memory parameters", () => {
      const result = getTooltipContent("memory", "cache_ram");

      expect(result).toBeDefined();
      expect(result?.title).toBe("Cache RAM");
    });

    it("should return tooltip content for valid gpu parameters", () => {
      const result = getTooltipContent("gpu", "device");

      expect(result).toBeDefined();
      expect(result?.title).toBe("Device");
    });

    it("should return tooltip content for valid advanced parameters", () => {
      const result = getTooltipContent("advanced", "custom_params");

      expect(result).toBeDefined();
      expect(result?.title).toBe("Custom Params");
    });

    it("should return tooltip content for valid lora parameters", () => {
      const result = getTooltipContent("lora", "lora");

      expect(result).toBeDefined();
      expect(result?.title).toBe("LoRA Path");
    });

    it("should return tooltip content for valid multimodal parameters", () => {
      const result = getTooltipContent("multimodal", "mmproj");

      expect(result).toBeDefined();
      expect(result?.title).toBe("MMPROJ");
    });

    it("should return undefined for invalid config type", () => {
      const result = getTooltipContent("invalid" as ConfigType, "temperature");

      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid field name", () => {
      const result = getTooltipContent("sampling", "invalid_field");

      expect(result).toBeUndefined();
    });

    it("should return undefined when configType is null", () => {
      const result = getTooltipContent(null as any, "temperature");

      expect(result).toBeUndefined();
    });
  });

  describe("Tooltip Content Structure", () => {
    it("should have all required fields for temperature parameter", () => {
      const tooltip = getTooltipContent("sampling", "temperature");

      expect(tooltip).toBeDefined();
      expect(tooltip?.title).toBeDefined();
      expect(tooltip?.description).toBeDefined();
      expect(tooltip?.recommendedValue).toBeDefined();
      expect(tooltip?.effectOnModel).toBeDefined();
      expect(tooltip?.whenToAdjust).toBeDefined();
    });

    it("should have title for all parameters", () => {
      const configTypes: ConfigType[] = ["sampling", "memory", "gpu", "advanced", "lora", "multimodal"];

      configTypes.forEach((configType) => {
        Object.keys(tooltipConfig[configType] || {}).forEach((field) => {
          const tooltip = getTooltipContent(configType, field);
          expect(tooltip?.title).toBeDefined();
          expect(tooltip?.title).not.toBe("");
        });
      });
    });

    it("should have description for all parameters", () => {
      const configTypes: ConfigType[] = ["sampling", "memory", "gpu", "advanced", "lora", "multimodal"];

      configTypes.forEach((configType) => {
        Object.keys(tooltipConfig[configType] || {}).forEach((field) => {
          const tooltip = getTooltipContent(configType, field);
          expect(tooltip?.description).toBeDefined();
          expect(tooltip?.description.length).toBeGreaterThan(10);
        });
      });
    });
  });

  describe("Specific Parameter Tooltips", () => {
    describe("Temperature", () => {
      const tooltip = getTooltipContent("sampling", "temperature");

      it("should describe randomness control", () => {
        expect(tooltip?.description).toContain("randomness");
      });

      it("should recommend 0.0 - 2.0 range", () => {
        expect(tooltip?.recommendedValue).toContain("0.0 - 2.0");
      });

      it("should mention creativity vs determinism", () => {
        expect(tooltip?.effectOnModel).toMatch(/(creative|deterministic|focused)/i);
      });
    });

    describe("Top P", () => {
      const tooltip = getTooltipContent("sampling", "top_p");

      it("should describe nucleus sampling", () => {
        expect(tooltip?.description.toLowerCase()).toContain("nucleus");
      });

      it("should recommend 0.1 - 1.0 range", () => {
        expect(tooltip?.recommendedValue).toContain("0.1 - 1.0");
      });
    });

    describe("GPU Layers", () => {
      const tooltip = getTooltipContent("gpu", "gpu_layers");

      it("should describe GPU offloading", () => {
        expect(tooltip?.description).toContain("GPU");
      });

      it("should mention -1 as all possible layers", () => {
        expect(tooltip?.recommendedValue).toContain("-1");
      });
    });

    describe("LoRA", () => {
      const tooltip = getTooltipContent("lora", "lora");

      it("should describe LoRA adapter", () => {
        expect(tooltip?.description).toContain("LoRA");
      });

      it("should mention fine-tuning", () => {
        if (tooltip?.whenToAdjust) {
          expect(tooltip.whenToAdjust).toMatch(/(fine-tune|specialize)/i);
        }
      });
    });

    describe("MMPROJ", () => {
      const tooltip = getTooltipContent("multimodal", "mmproj");

      it("should describe multimodal projection model", () => {
        expect(tooltip?.description).toContain("projection");
      });

      it("should mention CLIP", () => {
        expect(tooltip?.description).toContain("CLIP");
      });
    });
  });

  describe("Coverage", () => {
    it("should have tooltips for all sampling fields mentioned in requirements", () => {
      const requiredFields = [
        "temperature",
        "top_k",
        "top_p",
        "min_p",
        "repeat_penalty",
        "presence_penalty",
        "frequency_penalty",
      ];

      requiredFields.forEach((field) => {
        const tooltip = getTooltipContent("sampling", field);
        expect(tooltip).toBeDefined();
      });
    });

    it("should have tooltips for all memory-related fields", () => {
      const memoryFields = Object.keys(tooltipConfig.memory || {});

      expect(memoryFields.length).toBeGreaterThan(0);
      memoryFields.forEach((field) => {
        const tooltip = getTooltipContent("memory", field);
        expect(tooltip).toBeDefined();
      });
    });

    it("should have tooltips for all gpu-related fields", () => {
      const gpuFields = Object.keys(tooltipConfig.gpu || {});

      expect(gpuFields.length).toBeGreaterThan(0);
      gpuFields.forEach((field) => {
        const tooltip = getTooltipContent("gpu", field);
        expect(tooltip).toBeDefined();
      });
    });

    it("should have tooltips for all advanced fields", () => {
      const advancedFields = Object.keys(tooltipConfig.advanced || {});

      expect(advancedFields.length).toBeGreaterThan(0);
      advancedFields.forEach((field) => {
        const tooltip = getTooltipContent("advanced", field);
        expect(tooltip).toBeDefined();
      });
    });

    it("should have tooltips for all lora fields", () => {
      const loraFields = Object.keys(tooltipConfig.lora || {});

      expect(loraFields.length).toBeGreaterThan(0);
      loraFields.forEach((field) => {
        const tooltip = getTooltipContent("lora", field);
        expect(tooltip).toBeDefined();
      });
    });

    it("should have tooltips for all multimodal fields", () => {
      const multimodalFields = Object.keys(tooltipConfig.multimodal || {});

      expect(multimodalFields.length).toBeGreaterThan(0);
      multimodalFields.forEach((field) => {
        const tooltip = getTooltipContent("multimodal", field);
        expect(tooltip).toBeDefined();
      });
    });
  });

  describe("Tooltip Quality", () => {
    it("should have descriptive descriptions", () => {
      const tooltip = getTooltipContent("sampling", "temperature");
      expect(tooltip?.description.length).toBeGreaterThan(50);
    });

    it("should have practical whenToAdjust guidance", () => {
      const tooltip = getTooltipContent("sampling", "temperature");
      expect(tooltip?.whenToAdjust).toBeDefined();
      if (tooltip?.whenToAdjust) {
        expect(tooltip.whenToAdjust.length).toBeGreaterThan(20);
      }
    });

    it("should have clear effect descriptions", () => {
      const tooltip = getTooltipContent("sampling", "temperature");
      expect(tooltip?.effectOnModel).toBeDefined();
      if (tooltip?.effectOnModel) {
        expect(tooltip.effectOnModel.length).toBeGreaterThan(20);
      }
    });
  });
});
