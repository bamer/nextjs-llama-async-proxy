/**
 * Filter Utility - Reusable filtering logic
 */

const FilterHelper = {
  /**
   * Apply filters to an array of items
   * @param {Array} items - Items to filter
   * @param {Object} filters - Filter configuration
   * @param {Object} config - Filter field mappings
   * @returns {Array} Filtered items
   */
  apply(items, filters, config) {
    console.log("[DEBUG] FilterHelper.apply:", { itemCount: items?.length, filters, config });
    if (!items || !Array.isArray(items)) {
      return [];
    }

    let result = [...items];

    // Apply search filter
    if (filters.search && filters.search.trim() !== "") {
      const searchLower = filters.search.toLowerCase().trim();
      const searchFields = config.searchFields || ["name"];

      result = result.filter((item) => {
        return searchFields.some((field) => {
          const value = this._getNestedValue(item, field);
          return value && String(value).toLowerCase().includes(searchLower);
        });
      });

      console.log("[DEBUG] FilterHelper - After search filter:", { count: result.length });
    }

    // Apply select filters (exact match)
    if (filters.select) {
      for (const [key, value] of Object.entries(filters.select)) {
        if (value && value !== "all" && value !== "") {
          const field = config.fieldMap?.[key] || key;
          result = result.filter((item) => {
            const itemValue = this._getNestedValue(item, field);
            return String(itemValue) === String(value);
          });
          console.log("[DEBUG] FilterHelper - After select filter:", {
            key,
            value,
            count: result.length,
          });
        }
      }
    }

    // Apply multi-field filters
    if (filters.multi) {
      for (const [key, values] of Object.entries(filters.multi)) {
        if (values && Array.isArray(values) && values.length > 0) {
          const field = config.fieldMap?.[key] || key;
          result = result.filter((item) => {
            const itemValue = this._getNestedValue(item, field);
            return values.includes(String(itemValue));
          });
          console.log("[DEBUG] FilterHelper - After multi filter:", {
            key,
            values,
            count: result.length,
          });
        }
      }
    }

    console.log("[DEBUG] FilterHelper.apply - Result:", { count: result.length });
    return result;
  },

  /**
   * Get nested object value by dot notation path
   * @private
   */
  _getNestedValue(obj, path) {
    if (!path || !obj) return null;

    const keys = path.split(".");
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }

    return value;
  },

  /**
   * Create filter configuration for common use cases
   */
  configs: {
    // Models page filter config
    models: {
      searchFields: ["name"],
      fieldMap: {
        status: "status",
      },
    },

    // Logs page filter config
    logs: {
      searchFields: ["message", "source"],
      fieldMap: {
        level: "level",
      },
    },

    // Presets page filter config
    presets: {
      searchFields: ["name", "label", "group"],
      fieldMap: {},
    },
  },
};

window.FilterHelper = FilterHelper;
