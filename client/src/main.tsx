import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_USER_POOL_ID!,
      userPoolClientId: process.env.VITE_USER_POOL_CLIENT_ID!,
    },
  },
});
createRoot(document.getElementById("root")!).render(<App />);
