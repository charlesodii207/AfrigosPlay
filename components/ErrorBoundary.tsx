"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string; stack: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "", stack: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message, stack: error.stack || "" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Also log it, in case remote logging is ever wired up later.
    console.error("Caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "#111",
            color: "#f66",
            padding: "16px",
            fontFamily: "monospace",
            fontSize: "13px",
            whiteSpace: "pre-wrap",
            minHeight: "100vh",
          }}
        >
          <p style={{ color: "#fff", fontWeight: "bold", marginBottom: "8px" }}>
            Something crashed. Debug info below:
          </p>
          <p>{this.state.message}</p>
          <p style={{ opacity: 0.7, marginTop: "8px" }}>{this.state.stack}</p>
        </div>
      );
    }

    return this.props.children;
  }
}