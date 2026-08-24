import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import Login from "./components/Login";
import Movies from "./components/Movies";
import VideoList from "./components/VideoList";
import CreateSeries from "./components/createSeries";
import UsersTable from "./components/UserTable";
import ProtectedRoute from "./routes/ProtectedRoute";
import Sidebar from "./components/SideBar";
import SeriesList from "./components/SeriesList";
import Episode from "./components/Episode";
import BannerComponent from "./components/BannerComponent";
import SendNotification from "./components/SendNotification";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Redirect from="/register" to="/login" />
        
        <Route path="/">
          <Sidebar />
          <Switch>
            <ProtectedRoute path="/movies" component={Movies} />
            <ProtectedRoute path="/videolist" component={VideoList} />
            <ProtectedRoute path="/create/series" component={CreateSeries} />
            <ProtectedRoute path="/user-table" component={UsersTable} />
            <ProtectedRoute path="/series-list" component={SeriesList} />
            <ProtectedRoute path="/banners-list" component={BannerComponent} />
            <ProtectedRoute path="/Episode-list" component={Episode} />
            <ProtectedRoute path="/send-notification" component={SendNotification} />
            <Redirect to="/login" />
          </Switch>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
