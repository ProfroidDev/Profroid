import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Lock } from "lucide-react";
import "./ForbiddenPage.css";

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="forbidden-page-container">
      <div className="forbidden-content">
        <div className="forbidden-icon">
          <Lock size={80} strokeWidth={1.5} />
        </div>

        <h1 className="forbidden-title">403 - Access Forbidden</h1>

        <p className="forbidden-message">
          You cannot access this resource. You may not have the necessary permissions to view this page.
        </p>

        <p className="forbidden-subtitle">
          If you believe this is a mistake, please contact the administrator.
        </p>

        <button className="btn-home" onClick={handleBackHome}>
          <Home size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
