/**
 * Model Defaults Form Component
 */

class ModelDefaultsForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      threads: props.threads || 4,
      batch_size: props.batch_size || 512,
      temperature: props.temperature || 0.7,
      repeatPenalty: props.repeatPenalty || 1.1,
    };
  }

  componentWillReceiveProps(newProps) {
    this.state = {
      threads: newProps.threads || 4,
      batch_size: newProps.batch_size || 512,
      temperature: newProps.temperature || 0.7,
      repeatPenalty: newProps.repeatPenalty || 1.1,
    };
  }

  render() {
    return Component.h(
      "div",
      { className: "settings-section" },
      Component.h("h2", {}, "Model Defaults"),
      Component.h("p", { className: "section-desc" }, "Default inference parameters"),
      Component.h(
        "div",
        { className: "card" },
        Component.h(
          "div",
          { className: "defaults-grid" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Threads"),
            Component.h("input", {
              type: "number",
              value: this.state.threads,
              min: 1,
              max: 64,
              id: "threads",
              onChange: (e) => {
                const val = parseInt(e.target.value) || 1;
                this.setState({ threads: val });
                this.props.onThreadsChange?.(val);
              },
            }),
            Component.h("small", {}, "CPU threads")
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Batch"),
            Component.h("input", {
              type: "number",
              value: this.state.batch_size,
              min: 1,
              max: 8192,
              id: "batch_size",
              onChange: (e) => {
                const val = parseInt(e.target.value) || 1;
                this.setState({ batch_size: val });
                this.props.onBatchSizeChange?.(val);
              },
            }),
            Component.h("small", {}, "Batch size")
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Temperature"),
            Component.h("input", {
              type: "number",
              value: this.state.temperature,
              min: 0,
              max: 2,
              step: 0.1,
              id: "temperature",
              onChange: (e) => {
                const val = parseFloat(e.target.value) || 0;
                this.setState({ temperature: val });
                this.props.onTemperatureChange?.(val);
              },
            }),
            Component.h("small", {}, "Response randomness")
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Repeat Penalty"),
            Component.h("input", {
              type: "number",
              value: this.state.repeatPenalty,
              min: 0,
              max: 2,
              step: 0.1,
              id: "repeatPenalty",
              onChange: (e) => {
                const val = parseFloat(e.target.value) || 0;
                this.setState({ repeatPenalty: val });
                this.props.onRepeatPenaltyChange?.(val);
              },
            }),
            Component.h("small", {}, "Penalize repetition")
          )
        )
      )
    );
  }
}

window.ModelDefaultsForm = ModelDefaultsForm;
