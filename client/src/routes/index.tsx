import { Component, ReactNode } from "react";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyForgotPassword from "@/pages/auth/VerifyForgotPassword";
import CreateNewPassword from "@/pages/auth/CreateNewPassword";
import StoryPageEditor from "@/components/StoryPageEditor";
import StoryPreview from "@/components/StoryPreview";
import EditStoryPage from "@/pages/auth/EditStoryPage";
import GeneratedStory from "@/pages/auth/GeneratedStory";
import StoryCreator from "@/pages/auth/StoryCreator";
import MyStories from "@/pages/auth/MyStories";
import Subscription from "@/pages/auth/Subscription";
import UserProfile from "@/pages/auth/UserProfile";
import ExamplesSection from "@/pages/auth/Examples";

interface RouteConfig {
  path: string;
  component: ReactNode;
  isProtected: boolean;
  isPublicOnly?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    component: <StoryCreator />,
    isProtected: false,
  },
  {
    path: "/signin",
    component: <SignIn />,
    isProtected: false,
    isPublicOnly: true,
  },
  {
    path: "/signup",
    component: <SignUp />,
    isProtected: false,
    isPublicOnly: true,
  },
  {
    path: "/forgot-password",
    component: <ForgotPassword />,
    isProtected: false,
    isPublicOnly: true,
  },
  {
    path: "/verify-forgot-password",
    component: <VerifyForgotPassword />,
    isProtected: false,
    isPublicOnly: true,
  },
  {
    path: "/create-new-password",
    component: <CreateNewPassword />,
    isProtected: false,
    isPublicOnly: true,
  },
   {
    path: "/generated-story/:storyId",
    component: <GeneratedStory />,
    isPublicOnly: false,
    isProtected: true,
  },
  {
    path: "/generated-story",
    component: <GeneratedStory />,
    isPublicOnly: false,
    isProtected: true,
  },
  {
    path: "/stories/:storyId/edit",
    component: <EditStoryPage />,
    isProtected: true,
  },
  {
    path: "/mystories",
    component: <MyStories />,
    isProtected: true, 
  },

  {
    path: "/editor",
    component: <StoryPageEditor />,
    isProtected: true,
  },
  {
    path: "/preview",
    component: <StoryPreview />,
    isProtected: true,
  },
  {
    path: "/subscription",
    component: <Subscription/>,
    isProtected: true,
  },
  {
    path: "/profile",
    component: <UserProfile/>,
    isProtected: true,
  },
  {
    path: "/examples",
    component: <ExamplesSection/>,
    isProtected: true,
  },
];
