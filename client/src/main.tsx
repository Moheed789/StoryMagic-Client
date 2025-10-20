import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:"us-east-1_AR2R0wGOk",
      userPoolClientId: "5i7gbv9mbgqfed8in84jku430b",
    },
  },
});
createRoot(document.getElementById("root")!).render(<App />);
