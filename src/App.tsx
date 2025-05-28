import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/App.css";
import { Container } from "react-bootstrap";
import AppRoutes from "./routes";
import './i18n';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-wrapper">
        <Container fluid className="py-3">
          <AppRoutes />
        </Container>
      </div>
    </Router>
  );
};

export default App;
