import React from "react";
import { useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import LiveClockUpdate from "../components/landing/LiveClockUpdate";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/upload");
  };

  return (
    <div className="landing-container">
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      >
        <Spline scene="https://prod.spline.design/XnUTz5dreywXwjja/scene.splinecode" />
      </div>

      <div className="live-clock">
        <LiveClockUpdate />
      </div>

      <div className="hero-header">
        <h2>Mallards</h2>
        <p>Building trust in AI lending through transparency and cultural alignment.</p>
        <button className="auth-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;