/**
 * Chart Colors Module - Manages theme-aware colors for charts
 */
/* global MutationObserver */

if (typeof ChartColors === "undefined") {
  class ChartColors {
    constructor(isDarkMode = false) {
      this.isDarkMode = isDarkMode;
    }

    /**
     * Get current theme colors
     * @returns {Object} Colors for chart elements
     */
    getColors() {
      return {
        textColor: this.isDarkMode ? "#a1a5b0" : "#374151",
        gridColor: this.isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        tickColor: this.isDarkMode ? "#6b7280" : "#6b7280",
      };
    }

    /**
     * Update dark mode state
     * @param {boolean} isDark - New dark mode state
     */
    setDarkMode(isDark) {
      this.isDarkMode = isDark;
    }

    /**
     * Create a MutationObserver to watch for theme changes
     * @param {Function} callback - Called when theme changes
     * @returns {MutationObserver} The observer instance
     */
    createThemeObserver(callback) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            const isDark = document.documentElement.classList.contains("dark-mode");
            if (isDark !== this.isDarkMode) {
              this.isDarkMode = isDark;
              callback(isDark);
            }
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      return observer;
    }
  }

  window.ChartColors = ChartColors;
}
