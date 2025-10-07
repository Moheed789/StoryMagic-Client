"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import StoryPageEditor from "@/components/StoryPageEditor";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const GeneratedStory = () => {
  const { currentStep, setCurrentStep } = useAuth();
  const { characterDescription, setCharacterDescription } = useAuth();
  const { currentStory, setCurrentPages, currentPages } = useAuth();
  const { toast } = useToast();

  const batchGenerateImagesMutation = useMutation({
    mutationFn: async () => {
      if (!currentStory) throw new Error("No story selected");

      const response = await apiRequest(
        "POST",
        `/api/stories/${currentStory.id}/generate-all-images`,
        {
          characterDescription: characterDescription.trim() || undefined,
        }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentPages(data.pages);
      toast({
        title: "All Images Generated!",
        description:
          "Successfully generated images for your story with consistent characters and style.",
      });
    },
    onError: (error) => {
      console.error("Batch image generation failed:", error);
      toast({
        title: "Batch Generation Failed",
        description:
          "Failed to generate all images. Please try again or generate them individually.",
        variant: "destructive",
      });
    },
  });

  const handleBatchGenerateImages = () => {
    batchGenerateImagesMutation.mutate();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Edit Your Story
          </h2>
          <p className="text-muted-foreground font-story text-lg mb-6">
            Refine your story text and image descriptions. Make it perfect!
          </p>
          <div className="flex justify-center gap-3 mb-6">
            <button
              data-testid="button-back-to-chat"
              onClick={() => setCurrentStep("idea")}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              ← Back to Chat
            </button>
            <button
              data-testid="button-preview-story"
              onClick={() => setCurrentStep("preview")}
              className="bg-primary text-primary-foreground px-4 py-1 rounded-lg text-sm font-medium hover-elevate"
            >
              Preview Story →
            </button>
          </div>
          <div className="text-center mb-6">
            <div className="bg-card border rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="font-semibold mb-2">Character Consistency</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define your main character&apos;s appearance once to ensure they
                look the same in every illustration.
              </p>

              <div className="mb-4">
                <Label
                  htmlFor="character-description"
                  className="text-sm font-semibold mb-2 block text-left"
                >
                  Main Character Description
                </Label>
                <Textarea
                  id="character-description"
                  data-testid="textarea-character-description"
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  className="min-h-[100px] resize-none mb-2"
                  placeholder="Describe your main character's appearance in detail... (e.g., 'A small bunny with soft white fur, big floppy ears, bright blue eyes, wearing a red scarf and tiny blue boots. Has a gentle, curious expression.')"
                />
                <p className="text-xs text-muted-foreground text-left">
                  Be specific about physical features, clothing, colors, and
                  style. This description will be used for all images.
                </p>
              </div>

              <Button
                data-testid="button-batch-generate-images"
                onClick={handleBatchGenerateImages}
                disabled={
                  batchGenerateImagesMutation.isPending ||
                  !characterDescription.trim()
                }
                className="gap-2"
              >
                {batchGenerateImagesMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent"></div>
                    Generating All Images...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="h-4 w-4" />
                    Generate All Images with Consistent Character
                  </>
                )}
              </Button>

              {!characterDescription.trim() && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Please add a character description above to ensure consistency
                </p>
              )}
            </div>
          </div>
        </div>

        {currentPages.map((page) => (
          <StoryPageEditor
            key={page.id}
            page={page}
            onPageUpdate={handlePageUpdate}
            onRegenerateImage={handleRegenerateImage}
          />
        ))}
      </div>
    </div>
  );
};

export default GeneratedStory;


