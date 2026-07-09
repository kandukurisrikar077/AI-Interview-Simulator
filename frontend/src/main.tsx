import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div
      style={{
        color: "white",
        background: "#111",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "40px",
      }}
    >
      React is working ✅
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);