import { Route, HashRouter, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import HomePage from "./HomePage";
import Auth from "./Auth";

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" />
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </HashRouter>
    </>
  );
};

export default App;
