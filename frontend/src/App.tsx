import "./App.css";
import { UserProvider } from "./context/useAuth";
import { Outlet } from "react-router";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <UserProvider>
      <ToastContainer />
      <Navbar />
      <Outlet />
    </UserProvider>
  );
}

export default App;
