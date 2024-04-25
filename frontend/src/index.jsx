import React from "react";
import ReactDOM from "react-dom/client";
import "nprogress/nprogress.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from './contexts/NotificationContext';
import { TabProvider } from './contexts/TabContext'
import App from "./App";
import { ChakraProvider } from '@chakra-ui/react' // Similar to the other wrappers around App, Chakra UI provides its own UI wrapper, that ensures that everything inside the App is based on the UI library
import './styles.css'; // Import custom scrollbar styles

// NP progress is a module used to have loader for each page

// React Strict is the root wrapper which transfers the pages from the App (We can see a wrapped hierarchy)

// BrowserRouter is the Routing of the website..

// AuthProvider is using the route Auth from the backend to check is user Authenticated on each page

// The Root Element is the App (the renderer of all pages)


ReactDOM.createRoot(document.getElementById("root")).render(
  <ChakraProvider>
    <React.StrictMode>
      <BrowserRouter>
        <NotificationsProvider>
          <TabProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </TabProvider>
        </NotificationsProvider>
      </BrowserRouter>
    </React.StrictMode>
  </ChakraProvider>
);

