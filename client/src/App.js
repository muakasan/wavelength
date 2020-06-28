import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import "./App.scss";

import Homepage from "./pages/Homepage";
import Game from "./pages/Game";

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Homepage} />
        <Route path="/:lobbyId" children={<Game />} />
      </Switch>
    </Router>
  );
}
