import "./App.css";
import { UserProvider } from "./context/useAuth";
import { Outlet } from "react-router";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { AuthZProvider } from "./context/AuthZContext";

function App() {
  return (
    <UserProvider>
      <AuthZProvider>
        <ToastContainer />
        <Navbar />
        <Outlet />
      </AuthZProvider>
    </UserProvider>
  );
}

export default App;
