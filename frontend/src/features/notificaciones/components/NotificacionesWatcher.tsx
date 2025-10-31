import { useAuth } from "../../../context/useAuth";
import { useNotificacionesToast } from "../hooks/useNotificacionesToast";

const NotificacionesWatcher = () => {
  const { user, token } = useAuth();
  const enabled = Boolean(user && token);
  useNotificacionesToast({ enabled });
  return null;
};

export default NotificacionesWatcher;
