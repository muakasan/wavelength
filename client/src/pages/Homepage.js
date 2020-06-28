import React, { Component } from "react";

export default class Homepage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formText: "",
    };
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { formText } = this.state;
    this.props.history.push("/" + formText + "/");
  };

  onChange = (event) => {
    this.setState({
      formText: event.target.value,
    });
  };

  render() {
    const { formText } = this.state;
    return (
      <div className="homepage">
        <h1>WAVELENGTH</h1>
        <form onSubmit={this.handleSubmit}>
          <input type="text" value={formText} onChange={this.onChange} />
        </form>
      </div>
    );
  }
}
