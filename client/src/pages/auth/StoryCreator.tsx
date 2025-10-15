import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import {
  CartoonStyle,
  CartoonStyleSelector,
} from "@/components/CartoonStyleSelector";
import ChatInterface from "@/components/ChatInterface";

export default function StoryCreator() {
  const { setCurrentStory, setCurrentPages } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCartoonStyle, setSelectedCartoonStyle] =
    useState<CartoonStyle>("traditional");
  const handleStoryGenerated = (storyData: any) => {
    setCurrentStory(storyData.story);
    setCurrentPages(storyData.pages);
  };

  return (
    <div className="space-y-12">
      <HeroSection />
      <CartoonStyleSelector
        selectedStyle={selectedCartoonStyle}
        onStyleChange={setSelectedCartoonStyle}
      />
      <div className="mx-10">
        <ChatInterface selectedCartoonStyle={selectedCartoonStyle} onStoryGenerated={handleStoryGenerated} />
      </div>
    </div>
  );
}
