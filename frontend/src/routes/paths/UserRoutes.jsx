import { lazy } from "react";
import Loadable from "../Loadable";
import UserLayout from "../../components/layouts/user/index";
import AuthGuard from "../AuthGaurd";

const Profile = Loadable(lazy(() => import("../../pages/user/Profile")));
const Dashboard = Loadable(lazy(() => import("../../pages/user/Dashboard")));
const UserPage = Loadable(lazy(() => import("../../pages/user/UserPage")));
const Settings = Loadable(lazy(() => import("../../pages/user/Settings")))

const UserRoutes = {
  element: (
    <AuthGuard allowRole="user">
      <UserLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: "user/dashboard",
      element: <Dashboard />,
    },
    {
      path: "user/profile",
      element: <Profile />,
    },
    {
      path: "user/search/:username",
      element: <UserPage />
    },
    {
      path: "user/settings",
      element: <Settings />
    }
  ],
};

export default UserRoutes;