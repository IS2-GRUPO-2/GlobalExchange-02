import "./App.css";
import { UserProvider } from "./context/useAuth";
import { Outlet, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { AuthZProvider } from "./context/AuthZContext";

const HIDE_NAV_ROUTES = ["/login", "/register","/Register","/Login"];

function App() {
  const { pathname } = useLocation();
  const hideNavbar = HIDE_NAV_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <UserProvider>
      <AuthZProvider>
        <ToastContainer 
          position="top-right"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={2}
          theme="light"
        />
        {!hideNavbar && <Navbar />}
        <Outlet />
      </AuthZProvider>
    </UserProvider>
  );
}

export default App;
