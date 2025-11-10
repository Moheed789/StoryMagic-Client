"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword,
  resendSignUpCode,
  type SignUpOutput,
  type SignInOutput,
} from "aws-amplify/auth";

export type StoryPage = {
  id: string;
  storyId: string;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Story = {
  id: string;
  title: string;
  author?: string;
  status?: string;
  totalPages?: number;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  pages?: StoryPage[];
};

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUpUser: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<SignUpOutput>;
  confirmUserSignUp: (
    email: string,
    code: string,
    password: string
  ) => Promise<void>;
  confirmSignUpOnly: (email: string, code: string) => Promise<void>;
  resendSignUpUser: (email: string) => Promise<void>;
  signInUser: (email: string, password: string) => Promise<SignInOutput | void>;
  signOutUser: () => Promise<void>;
  getUserProfile: () => Promise<any | null>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
  verifyForgotCode: (email: string, code: string) => Promise<boolean>;
  step: any | null;
  setStep: React.Dispatch<React.SetStateAction<any | null>>;
  currentStep: "idea" | "edit" | "preview";
  setCurrentStep: React.Dispatch<
    React.SetStateAction<"idea" | "edit" | "preview">
  >;
  characterDescription: string;
  setCharacterDescription: React.Dispatch<React.SetStateAction<string>>;
  currentStory: Story | null;
  setCurrentStory: React.Dispatch<React.SetStateAction<Story | null>>;
  currentPages: StoryPage[];
  setCurrentPages: React.Dispatch<React.SetStateAction<StoryPage[]>>;
  selectedPageCount: number | null;
  setSelectedPageCount: React.Dispatch<React.SetStateAction<number | null>>;
  storyTitle: string;
  setStoryTitle: React.Dispatch<React.SetStateAction<string>>;
  authorName: string;
  setAuthorName: React.Dispatch<React.SetStateAction<string>>;
  storyId: any;
  setStoryId: React.Dispatch<React.SetStateAction<any>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [step, setStep] = useState<any | null>("form");
  const [currentStep, setCurrentStep] = useState<"idea" | "edit" | "preview">(
    "idea"
  );
  const [storyId, setStoryId] = useState();
  const [selectedPageCount, setSelectedPageCount] = useState<number | null>(
    null
  );
  const [storyTitle, setStoryTitle] = useState();
  const [authorName, setAuthorName] = useState<string>(
    (user as any)?.attributes?.name ||
      (user as any)?.username ||
      (user as any)?.email ||
      ""
  );
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentPages, setCurrentPages] = useState<StoryPage[]>([]);
  const [characterDescription, setCharacterDescription] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // ============================
  // Fetch helper for private APIs
  // ============================
  const fetchWithAuth = async (endpoint: string) => {
    try {
      const session: any = await (
        await import("aws-amplify/auth")
      ).fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const res = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("API error");
      return await res.json();
    } catch (err) {
      console.error("API fetch error:", err);
      return null;
    }
  };

  // ============================
  // Initialization
  // ============================
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const apiProfile = await fetchWithAuth("/user");
        if (mounted) setUser({ ...currentUser, attributes, apiProfile });
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  // ============================
  // Auth functions
  // ============================
  const signUpUser = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    return await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name: fullName } },
    });
  };

  const resendSignUpUser = async (email: string) => {
    await resendSignUpCode({ username: email });
  };

  const confirmUserSignUp = async (
    email: string,
    code: string,
    password: string
  ) => {
    await confirmSignUp({ username: email, confirmationCode: code });
    await signInUser(email, password);
  };

  const confirmSignUpOnly = async (email: string, code: string) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  };

  const signInUser = async (email: string, password: string) => {
    const res = await signIn({ username: email, password });
    
    // Check if there's a challenge that needs to be handled
    const challengeName = res?.nextStep?.challengeName;
    const signInStep = res?.nextStep?.signInStep;
    
    // Only set user if authentication is complete (no challenge)
    // Handle PASSWORD_VERIFIER and CONFIRM_SIGN_UP challenges
    if (
      challengeName === "PASSWORD_VERIFIER" ||
      challengeName === "CONFIRM_SIGN_UP" ||
      signInStep === "PASSWORD_VERIFIER" ||
      signInStep === "CONFIRM_SIGN_UP"
    ) {
      // Don't set user yet, return the response so the caller can handle the challenge
      return res;
    }
    
    // Authentication is complete, set the user
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const apiProfile = await fetchWithAuth("/user");
      setUser({ ...currentUser, attributes, apiProfile });
    } catch (err) {
      // If getCurrentUser fails, user might still be in a challenge state
      // Return the response anyway so caller can handle it
      console.error("Error getting current user:", err);
    }
    
    return res;
  };

  const signOutUser = async () => {
    await signOut();
    setUser(null);
  };

  const getUserProfile = async () => {
    const apiProfile = await fetchWithAuth("/user");
    if (user) {
      const merged = { ...user, apiProfile };
      setUser(merged);
      return merged;
    }
    return apiProfile;
  };

  // ============================
  // Forgot Password Flow
  // ============================
  const forgotPassword = async (email: string) => {
    await resetPassword({ username: email });
  };

const confirmForgotPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword, // <-- yahan user ka actual password jaayega
    });
  } catch (err: any) {
    console.error("Error confirming password:", err);
    throw err;
  }
};

  const verifyForgotCode = async (email: string, code: string) => {
    try {
      // Try confirming the code with a deliberately invalid password
      // This will fail with InvalidPasswordException if code is valid
      // This prevents accidentally resetting the password
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: "x", // Deliberately invalid password (too short, no uppercase, no special char)
      });
      // If we reach here, something unexpected happened
      // Don't return true as the password might have been reset
      console.warn("verifyForgotCode: Unexpected success with invalid password");
      return false;
    } catch (err: any) {
      if (
        err.name === "InvalidPasswordException" ||
        err.message?.includes("Password did not conform") ||
        err.message?.includes("password")
      ) {
        // Code is correct, only password invalid - code is still valid
        return true;
      } else if (
        err.name === "CodeMismatchException" ||
        err.name === "ExpiredCodeException"
      ) {
        // Code is invalid or expired
        return false;
      } else {
        console.error("verifyForgotCode unknown error:", err);
        return false;
      }
    }
  };

  // ============================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        signUpUser,
        confirmUserSignUp,
        confirmSignUpOnly,
        resendSignUpUser,
        signInUser,
        signOutUser,
        getUserProfile,
        forgotPassword,
        confirmForgotPassword,
        verifyForgotCode,
        step,
        setStep,
        currentStep,
        setCurrentStep,
        characterDescription,
        setCharacterDescription,
        currentStory,
        setCurrentStory,
        currentPages,
        setCurrentPages,
        selectedPageCount,
        setSelectedPageCount,
        storyTitle,
        setStoryTitle,
        authorName,
        setAuthorName,
        storyId,
        setStoryId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
