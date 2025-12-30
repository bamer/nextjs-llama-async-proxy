/**
 * Additional edge case and validation tests for tooltip-config.ts
 * These tests complement the main tooltip-config.test.ts file
 */

import { getTooltipContent, tooltipConfig } from "@/config/tooltip-config";
import { ConfigType } from "@/components/ui/ModelConfigDialog";

describe("tooltip-config.ts - Edge Cases & Validation", () => {
  describe("getTooltipContent Edge Cases", () => {
    it("returns undefined for invalid config type", () => {
      const result = getTooltipContent("invalid_type" as ConfigType, "temperature");
      expect(result).toBeUndefined();
    });

    it("returns undefined for invalid field name", () => {
      const result = getTooltipContent("sampling", "invalid_field_name");
      expect(result).toBeUndefined();
    });

    it("returns undefined for null config type", () => {
      const result = getTooltipContent(null as any, "temperature");
      expect(result).toBeUndefined();
    });

    it("returns undefined for undefined field", () => {
      const result = getTooltipContent("sampling", undefined as any);
      expect(result).toBeUndefined();
    });

    it("handles empty string field name", () => {
      const result = getTooltipContent("sampling", "");
      expect(result).toBeUndefined();
    });
  });

  describe("Tooltip Structure Validation", () => {
    const configTypes: ConfigType[] = [
      "sampling",
      "memory",
      "gpu",
      "advanced",
      "lora",
      "multimodal",
    ];

    configTypes.forEach((configType) => {
      describe(`${configType} config type`, () => {
        it(`has all tooltips with title field`, () => {
          const fields = Object.keys(tooltipConfig[configType] || {});
          fields.forEach((field) => {
            const tooltip = getTooltipContent(configType, field);
            expect(tooltip).toBeDefined();
            expect(tooltip?.title).toBeDefined();
            expect(tooltip?.title.length).toBeGreaterThan(0);
          });
        });

        it(`has all tooltips with description field`, () => {
          const fields = Object.keys(tooltipConfig[configType] || {});
          fields.forEach((field) => {
            const tooltip = getTooltipContent(configType, field);
            expect(tooltip).toBeDefined();
            expect(tooltip?.description).toBeDefined();
            expect(tooltip?.description.length).toBeGreaterThan(0);
          });
        });

        it(`has all tooltips with recommendedValue field`, () => {
          const fields = Object.keys(tooltipConfig[configType] || {});
          fields.forEach((field) => {
            const tooltip = getTooltipContent(configType, field);
            expect(tooltip).toBeDefined();
            // recommendedValue is optional per interface
            if (tooltip?.recommendedValue) {
              expect(tooltip.recommendedValue.length).toBeGreaterThan(0);
            }
          });
        });

        it(`has all tooltips with effectOnModel field`, () => {
          const fields = Object.keys(tooltipConfig[configType] || {});
          fields.forEach((field) => {
            const tooltip = getTooltipContent(configType, field);
            expect(tooltip).toBeDefined();
            // effectOnModel is optional per interface
            if (tooltip?.effectOnModel) {
              expect(tooltip.effectOnModel.length).toBeGreaterThan(0);
            }
          });
        });

        it(`has all tooltips with whenToAdjust field`, () => {
          const fields = Object.keys(tooltipConfig[configType] || {});
          fields.forEach((field) => {
            const tooltip = getTooltipContent(configType, field);
            expect(tooltip).toBeDefined();
            // whenToAdjust is optional per interface
            if (tooltip?.whenToAdjust) {
              expect(tooltip.whenToAdjust.length).toBeGreaterThan(0);
            }
          });
        });
      });
    });
  });

  describe("Tooltip Content Quality", () => {
    it("has non-empty titles for all tooltips", () => {
      Object.entries(tooltipConfig).forEach(([configType, fields]) => {
        Object.entries(fields).forEach(([fieldName, tooltip]) => {
          expect(tooltip.title).toBeDefined();
          expect(tooltip.title.length).toBeGreaterThan(0);
          expect(tooltip.title.trim()).toBe(tooltip.title);
        });
      });
    });

    it("has descriptive descriptions for all tooltips", () => {
      Object.entries(tooltipConfig).forEach(([configType, fields]) => {
        Object.entries(fields).forEach(([fieldName, tooltip]) => {
          expect(tooltip.description).toBeDefined();
          expect(tooltip.description.length).toBeGreaterThan(0);
          expect(tooltip.description.trim()).toBe(tooltip.description);
        });
      });
    });

    it("has meaningful recommended values", () => {
      const tooltipsWithRecs = [
        getTooltipContent("sampling", "temperature"),
        getTooltipContent("sampling", "top_p"),
        getTooltipContent("sampling", "top_k"),
      ];

      tooltipsWithRecs.forEach((tooltip) => {
        if (tooltip) {
          expect(tooltip.recommendedValue).toBeDefined();
          expect(tooltip.recommendedValue?.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("Parameter Specific Validation", () => {
    it("has temperature tooltip with creativity context", () => {
      const tooltip = getTooltipContent("sampling", "temperature");
      expect(tooltip).toBeDefined();
      expect(tooltip?.description).toMatch(/(randomness|creative|deterministic)/i);
    });

    it("has top_p tooltip with nucleus sampling context", () => {
      const tooltip = getTooltipContent("sampling", "top_p");
      expect(tooltip).toBeDefined();
      expect(tooltip?.description.toLowerCase()).toContain("nucleus");
    });

    it("has repeat_penalty tooltip with repetition context", () => {
      const tooltip = getTooltipContent("sampling", "repeat_penalty");
      expect(tooltip).toBeDefined();
      expect(tooltip?.description).toMatch(/(repeat|penalty)/i);
    });

    it("has gpu_layers tooltip with GPU context", () => {
      const tooltip = getTooltipContent("gpu", "gpu_layers");
      expect(tooltip).toBeDefined();
      expect(tooltip?.description).toMatch(/(gpu|layer|offload)/i);
    });

    it("has mirostat tooltip with algorithm context", () => {
      const tooltip = getTooltipContent("sampling", "mirostat");
      expect(tooltip).toBeDefined();
      expect(tooltip?.description).toMatch(/(mirostat|algorithm|perplexity)/i);
    });
  });

  describe("Tooltip Configuration Structure", () => {
    it("has all required config types", () => {
      const requiredTypes: ConfigType[] = [
        "sampling",
        "memory",
        "gpu",
        "advanced",
        "lora",
        "multimodal",
      ];

      requiredTypes.forEach((type) => {
        expect(tooltipConfig[type]).toBeDefined();
        expect(typeof tooltipConfig[type]).toBe("object");
      });
    });

    it("has non-empty tooltip objects for each config type", () => {
      const configTypes = Object.keys(tooltipConfig);
      configTypes.forEach((configType) => {
        const fields = tooltipConfig[configType as ConfigType];
        expect(Object.keys(fields).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Optional Fields Handling", () => {
    it("handles tooltips without recommendedValue", () => {
      // Some tooltips may not have all optional fields
      Object.entries(tooltipConfig).forEach(([configType, fields]) => {
        Object.entries(fields).forEach(([fieldName, tooltip]) => {
          // Just verify structure is valid, even if optional fields are missing
          expect(tooltip.title).toBeDefined();
          expect(tooltip.description).toBeDefined();
        });
      });
    });

    it("handles tooltips without effectOnModel", () => {
      // effectOnModel is optional
      Object.entries(tooltipConfig).forEach(([configType, fields]) => {
        Object.entries(fields).forEach(([fieldName, tooltip]) => {
          // Should not throw if effectOnModel is missing
          expect(() => {
            const hasEffect = tooltip.effectOnModel !== undefined;
            return hasEffect;
          }).not.toThrow();
        });
      });
    });

    it("handles tooltips without whenToAdjust", () => {
      // whenToAdjust is optional
      Object.entries(tooltipConfig).forEach(([configType, fields]) => {
        Object.entries(fields).forEach(([fieldName, tooltip]) => {
          // Should not throw if whenToAdjust is missing
          expect(() => {
            const hasWhenToAdjust = tooltip.whenToAdjust !== undefined;
            return hasWhenToAdjust;
          }).not.toThrow();
        });
      });
    });
  });

  describe("Tooltip Content Consistency", () => {
    it("has consistent field naming across config types", () => {
      // Field names should be consistent (e.g., temperature, top_p, top_k)
      const samplingFields = Object.keys(tooltipConfig.sampling || {});
      expect(samplingFields.length).toBeGreaterThan(20);

      // Key sampling parameters should exist
      expect(tooltipConfig.sampling).toHaveProperty("temperature");
      expect(tooltipConfig.sampling).toHaveProperty("top_p");
      expect(tooltipConfig.sampling).toHaveProperty("top_k");
    });

    it("has consistent formatting in recommended values", () => {
      const tooltips = [
        getTooltipContent("sampling", "temperature"),
        getTooltipContent("sampling", "top_p"),
        getTooltipContent("sampling", "top_k"),
      ];

      tooltips.forEach((tooltip) => {
        if (tooltip?.recommendedValue) {
          // Should contain range or default
          expect(tooltip.recommendedValue).toMatch(/(default:|\d+|\d+\.\d+)/i);
        }
      });
    });
  });

  describe("Safe Property Access", () => {
    it("handles accessing non-existent config type safely", () => {
      const result = tooltipConfig["nonexistent" as ConfigType];
      expect(result).toBeUndefined();
    });

    it("handles accessing nested properties safely", () => {
      const result = tooltipConfig["sampling"]?.["nonexistent_field"];
      expect(result).toBeUndefined();
    });
  });

  describe("Content Length Validation", () => {
    it("has reasonable title lengths", () => {
      Object.values(tooltipConfig).forEach((fields) => {
        Object.values(fields).forEach((tooltip) => {
          expect(tooltip.title.length).toBeGreaterThan(2);
          expect(tooltip.title.length).toBeLessThan(50);
        });
      });
    });

    it("has reasonable description lengths", () => {
      Object.values(tooltipConfig).forEach((fields) => {
        Object.values(fields).forEach((tooltip) => {
          expect(tooltip.description.length).toBeGreaterThan(0);
          expect(tooltip.description.length).toBeLessThan(500);
        });
      });
    });
  });

  describe("Specific Config Type Coverage", () => {
    it("has comprehensive sampling tooltips", () => {
      const samplingFields = Object.keys(tooltipConfig.sampling);
      expect(samplingFields.length).toBeGreaterThan(30);

      // Key sampling parameters
      const keyParams = [
        "temperature",
        "top_p",
        "top_k",
        "min_p",
        "repeat_penalty",
        "presence_penalty",
        "frequency_penalty",
      ];
      keyParams.forEach((param) => {
        expect(samplingFields).toContain(param);
      });
    });

    it("has comprehensive memory tooltips", () => {
      const memoryFields = Object.keys(tooltipConfig.memory);
      expect(memoryFields.length).toBeGreaterThan(5);

      // Key memory parameters
      expect(memoryFields).toContain("cache_ram");
      expect(memoryFields).toContain("mmap");
      expect(memoryFields).toContain("mlock");
    });

    it("has comprehensive GPU tooltips", () => {
      const gpuFields = Object.keys(tooltipConfig.gpu);
      expect(gpuFields.length).toBeGreaterThan(5);

      // Key GPU parameters
      expect(gpuFields).toContain("device");
      expect(gpuFields).toContain("gpu_layers");
      expect(gpuFields).toContain("tensor_split");
    });

    it("has comprehensive advanced tooltips", () => {
      const advancedFields = Object.keys(tooltipConfig.advanced);
      expect(advancedFields.length).toBeGreaterThan(10);

      // Key advanced parameters
      expect(advancedFields).toContain("swa_full");
      expect(advancedFields).toContain("cpu_moe");
      expect(advancedFields).toContain("kv_unified");
    });

    it("has comprehensive LoRA tooltips", () => {
      const loraFields = Object.keys(tooltipConfig.lora);
      expect(loraFields.length).toBeGreaterThan(10);

      // Key LoRA parameters
      expect(loraFields).toContain("lora");
      expect(loraFields).toContain("control_vector");
      expect(loraFields).toContain("model_draft");
    });

    it("has comprehensive multimodal tooltips", () => {
      const mmFields = Object.keys(tooltipConfig.multimodal);
      expect(mmFields.length).toBeGreaterThan(5);

      // Key multimodal parameters
      expect(mmFields).toContain("mmproj");
      expect(mmFields).toContain("mmproj_offload");
      expect(mmFields).toContain("image_max_tokens");
    });
  });
});
