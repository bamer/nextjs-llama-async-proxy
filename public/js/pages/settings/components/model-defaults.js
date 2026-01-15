/**
 * Model Defaults Form Component - Event-Driven DOM Updates
 */

class ModelDefaultsForm extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.threads = props.threads || 4;
    this.batch_size = props.batch_size || 512;
    this.temperature = props.temperature || 0.7;
    this.repeatPenalty = props.repeatPenalty || 1.1;
  }

  bindEvents() {
    // Threads
    this.on("change", "#threads", (e) => {
      const val = parseInt(e.target.value) || 1;
      this.threads = val;
      this._updateUI();
      this.props.onThreadsChange?.(val);
    });

    // Batch size
    this.on("change", "#batch_size", (e) => {
      const val = parseInt(e.target.value) || 1;
      this.batch_size = val;
      this._updateUI();
      this.props.onBatchSizeChange?.(val);
    });

    // Temperature
    this.on("change", "#temperature", (e) => {
      const val = parseFloat(e.target.value) || 0;
      this.temperature = val;
      this._updateUI();
      this.props.onTemperatureChange?.(val);
    });

    // Repeat penalty
    this.on("change", "#repeatPenalty", (e) => {
      const val = parseFloat(e.target.value) || 0;
      this.repeatPenalty = val;
      this._updateUI();
      this.props.onRepeatPenaltyChange?.(val);
    });
  }

  /**
   * Update the UI elements to match current component state.
   * @returns {void}
   */
  _updateUI() {
    if (!this._el) return;

    const threadsInput = this._el.querySelector("#threads");
    if (threadsInput && parseInt(threadsInput.value) !== this.threads) {
      threadsInput.value = this.threads;
    }

    const batchInput = this._el.querySelector("#batch_size");
    if (batchInput && parseInt(batchInput.value) !== this.batch_size) {
      batchInput.value = this.batch_size;
    }

    const tempInput = this._el.querySelector("#temperature");
    if (tempInput && parseFloat(tempInput.value) !== this.temperature) {
      tempInput.value = this.temperature;
    }

    const repeatInput = this._el.querySelector("#repeatPenalty");
    if (repeatInput && parseFloat(repeatInput.value) !== this.repeatPenalty) {
      repeatInput.value = this.repeatPenalty;
    }
  }

  render() {
    return Component.h("div", { className: "settings-section" }, [
      Component.h("h2", {}, "Model Defaults"),
      Component.h("p", { className: "section-desc" }, "Default inference parameters"),
      Component.h("div", { className: "card" }, [
        Component.h("div", { className: "defaults-grid" }, [
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Threads"),
            Component.h("input", {
              type: "number",
              value: this.threads,
              min: 1,
              max: 64,
              id: "threads",
            }),
            Component.h("small", {}, "CPU threads"),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Batch"),
            Component.h("input", {
              type: "number",
              value: this.batch_size,
              min: 1,
              max: 8192,
              id: "batch_size",
            }),
            Component.h("small", {}, "Batch size"),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Temperature"),
            Component.h("input", {
              type: "number",
              value: this.temperature,
              min: 0,
              max: 2,
              step: 0.1,
              id: "temperature",
            }),
            Component.h("small", {}, "Response randomness"),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Repeat Penalty"),
            Component.h("input", {
              type: "number",
              value: this.repeatPenalty,
              min: 0,
              max: 2,
              step: 0.1,
              id: "repeatPenalty",
            }),
            Component.h("small", {}, "Penalize repetition"),
          ]),
        ]),
      ]),
    ]);
  }
}

window.ModelDefaultsForm = ModelDefaultsForm;
