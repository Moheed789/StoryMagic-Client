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
  resendSignUpUser: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  signInUser: (email: string, password: string) => Promise<SignInOutput | void>;
  signOutUser: () => Promise<void>;
  getUserProfile: () => Promise<any | null>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
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
  selectedPageCount: number;
  setSelectedPageCount: React.Dispatch<React.SetStateAction<number>>;
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
  const [selectedPageCount, setSelectedPageCount] = useState<number>(1);

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

  const API_URL = "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev";

  const fetchWithAuth = async (endpoint: string) => {
    try {
      const session: any = await (
        await import("aws-amplify/auth")
      ).fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const res = await fetch(`${API_URL}${endpoint}`, {
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

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const apiProfile = await fetchWithAuth("/user");
        if (mounted) {
          setUser({ ...currentUser, attributes, apiProfile });
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

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

  const resendSignUpUser = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name: fullName } },
    });
  };

  const confirmUserSignUp = async (
    email: string,
    code: string,
    password: string
  ) => {
    await confirmSignUp({ username: email, confirmationCode: code });
    await signInUser(email, password);
  };

  const signInUser = async (email: string, password: string) => {
    const res = await signIn({ username: email, password });
    const currentUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const apiProfile = await fetchWithAuth("/user");
    setUser({ ...currentUser, attributes, apiProfile });
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

  const forgotPassword = async (email: string) => {
    await resetPassword({ username: email });
  };

  const confirmForgotPassword = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        signUpUser,
        confirmUserSignUp,
        resendSignUpUser,
        signInUser,
        signOutUser,
        getUserProfile,
        forgotPassword,
        confirmForgotPassword,
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
