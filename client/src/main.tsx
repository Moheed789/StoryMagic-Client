import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:"us-east-1_v4wLL7iJI",
      userPoolClientId: "5jrss1relgvpaggkgs1todqnfq",
    },
  },
});
createRoot(document.getElementById("root")!).render(<App />);
