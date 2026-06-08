import React from "react";
import { Route, Redirect } from "react-router-dom";

const getRole = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const token = localStorage.getItem("token");
  const role = token ? getRole(token) : null;
  const isAdmin = role === "ADMIN";

  return (
    <Route
      {...rest}
      render={(props) =>
        isAdmin ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export default ProtectedRoute;
