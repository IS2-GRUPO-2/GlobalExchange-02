import "./App.css";
import { UserProvider } from "./context/useAuth";
import { Outlet } from "react-router";
import Navbar from "./components/Navbar";

function App() {
  return (
    <UserProvider>
      <Navbar />
      <Outlet />
    </UserProvider>
  );
}

export default App;
