import React, { Component } from "react";

interface LiveClockUpdateState {
  date: Date;
}

class LiveClockUpdate extends Component<{}, LiveClockUpdateState> {
  private timerID: number | null = null;

  constructor(props: {}) {
    super(props);
    this.state = { date: new Date() };
  }

  componentDidMount(): void {
    this.timerID = window.setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount(): void {
    if (this.timerID !== null) {
      clearInterval(this.timerID);
    }
  }

  tick(): void {
    this.setState({
      date: new Date(),
    });
  }

  render(): JSX.Element {
    return (
      <div>
        <p>{this.state.date.toLocaleTimeString()}</p>
      </div>
    );
  }
}

export default LiveClockUpdate;
