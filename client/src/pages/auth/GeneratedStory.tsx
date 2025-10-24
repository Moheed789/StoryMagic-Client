"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import StoryPageEditor from "@/components/StoryPageEditor";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchAuthSession } from "aws-amplify/auth";
import { useLocation, useRoute } from "wouter";

type Story = {
  id: string;
  title: string;
  author?: string | null;
  status?: string;
  totalPages?: number;
  coverImageUrl?: string | null;
};

type StoryDetailsResponse = {
  story: Story;
  pages: Array<{
    id: string;
    storyId: string;
    pageNumber: number;
    text: string;
    imagePrompt: string;
    imageUrl?: string | null;
  }>;
};

const API_BASE = import.meta.env.VITE_BASE_URL;

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const session: any = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const GeneratedStory: React.FC = () => {
  const [, params] = useRoute("/generated-story/:storyId");
  const storyId = params?.storyId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { characterDescription } = useAuth();
  const { currentStory, setCurrentPages, currentPages, setCurrentStory } =
    useAuth() as any;

  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  

  const [unsavedPages, setUnsavedPages] = useState<Set<string>>(new Set());

  const pageEditorsRef = useRef<Map<string, () => Promise<boolean>>>(new Map());

  useEffect(() => {
    (async () => {
      if (!storyId) return;
      setLoading(true);
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch(`${API_BASE}/stories/${storyId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", ...authHeader },
        });
        if (!res.ok) throw new Error(`Failed to fetch story (${res.status})`);
        const data = (await res.json()) as StoryDetailsResponse;
        setCurrentStory?.(data.story);
        setCurrentPages?.(data.pages || []);
      } catch (e: any) {
        setFetchError(e?.message || "Failed to load story.");
      } finally {
        setLoading(false);
      }
    })();
  }, [storyId, setCurrentPages, setCurrentStory]);

  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const startStatusPolling = async () => {
    let attempts = 0;
    const maxAttempts = 40;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const id = window.setInterval(async () => {
      try {
        if (!storyId) return;
        const authHeader = await getAuthHeader();
        const res = await fetch(
          `${API_BASE}/stories/${storyId}/images-status`,
          {
            headers: { "Content-Type": "application/json", ...authHeader },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setCurrentPages(data.pages);

          const allDone = data.pages.every((p: any) => p.imageUrl);
          if (allDone) {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }

            setIsGenerating(false);
            toast({
              title: "All Images Ready!",
              description:
                "Your story images have been successfully generated.",
            });

            setTimeout(() => {
              navigate("/mystories");
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Status polling error:", err);
      }

      if (++attempts > maxAttempts) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setIsGenerating(false);
      }
    }, 5000);

    pollRef.current = id;
  };

  const saveAllUnsavedPages = async (): Promise<boolean> => {
    if (unsavedPages.size === 0) return true;

    try {
      const savePromises: Promise<boolean>[] = [];
      
      for (const pageId of Array.from(unsavedPages)) {
        const saveFunction = pageEditorsRef.current.get(pageId);
        if (saveFunction) {
          savePromises.push(saveFunction());
        }
      }

      const results = await Promise.all(savePromises);
      const allSaved = results.every(result => result === true);

      if (allSaved) {
        setUnsavedPages(new Set());
        toast({
          title: "Auto-save Complete",
          description: "All changes have been saved before generating images.",
          variant: "default",
        });
      }

      return allSaved;
    } catch (error) {
      console.error("Error saving pages:", error);
      toast({
        title: "Save Error",
        description: "Failed to save some changes. Please save manually before generating images.",
        variant: "destructive",
      });
      return false;
    }
  };

  const batchGenerateImagesMutation = useMutation({
    mutationFn: async () => {
      if (!storyId) throw new Error("Missing storyId from route");
      
      const saveSuccess = await saveAllUnsavedPages();
      if (!saveSuccess) {
        throw new Error("Please save all changes before generating images");
      }

      const authHeader = await getAuthHeader();

      const response = await fetch(
        `${API_BASE}/stories/${storyId}/generate-images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            characterDescription: characterDescription?.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const msg = await response.text().catch(() => "");
        throw new Error(msg || `Failed with ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "All Images Generating...",
        description: "We'll show them as soon as they're ready.",
      });
      setIsGenerating(true);
      startStatusPolling();
    },
    onError: (error) => {
      console.error("Batch image generation failed:", error);
      toast({
        title: "Batch Generation Failed",
        description: error.message || "Failed to generate all images. Please try again later.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleBatchGenerateImages = () => {
    if (isGenerating || batchGenerateImagesMutation.isPending) return;
    
    if (unsavedPages.size > 0) {
      toast({
        title: "Auto-saving Changes",
        description: "Saving your modifications before generating images...",
        variant: "default",
      });
    }
    
    batchGenerateImagesMutation.mutate();
  };

  const markPageAsUnsaved = (pageId: string) => {
    setUnsavedPages(prev => new Set([...Array.from(prev), pageId]));
  };

  const markPageAsSaved = (pageId: string) => {
    setUnsavedPages(prev => {
      const newSet = new Set(prev);
      newSet.delete(pageId);
      return newSet;
    });
  };

  const registerPageEditor = (pageId: string, saveFunction: () => Promise<boolean>) => {
    pageEditorsRef.current.set(pageId, saveFunction);
  };

  const unregisterPageEditor = (pageId: string) => {
    pageEditorsRef.current.delete(pageId);
  };

  const allImagesGenerated =
    (currentPages || []).length > 0 &&
    (currentPages || []).every((p: any) => p.imageUrl);

  if (!storyId)
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-red-600">
          No storyId in URL. Open a generated story link.
        </p>
      </div>
    );

  if (loading)
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
          <span>Loading your story…</span>
        </div>
      </div>
    );

  if (fetchError)
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <p className="text-red-600 font-medium">Error: {fetchError}</p>
      </div>
    );

  const isDisabled =
    isGenerating ||
    batchGenerateImagesMutation.isPending ||
    !storyId ||
    allImagesGenerated;

  const hasUnsavedChanges = unsavedPages.size > 0;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold mb-2">
            {currentStory?.title || "Edit Your Story"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {currentStory?.author
              ? `by ${currentStory.author}`
              : "Refine your story text and image descriptions."}
          </p>
          
          {hasUnsavedChanges && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You have unsaved changes in {unsavedPages.size} page(s). 
                Changes will be auto-saved when you generate images.
              </p>
            </div>
          )}
        </div>

        {(currentPages || []).map((page: any) => (
          <StoryPageEditor
            key={page.id}
            page={page}
            isBatchGenerating={isGenerating && !page.imageUrl}
            onMarkUnsaved={() => markPageAsUnsaved(page.id)}
            onMarkSaved={() => markPageAsSaved(page.id)}
            onRegisterSaveFunction={(saveFunction) => registerPageEditor(page.id, saveFunction)}
            onUnregisterSaveFunction={() => unregisterPageEditor(page.id)}
          />
        ))}
      </div>

      <div className="bg-card border rounded-lg p-6 max-w-3xl mx-auto mb-8 text-center mt-8">
        <h2 className="mb-4 w-full max-w-[400px] mx-auto text-[#8DA99E] font-[600] font-story">
          Are you happy with the story and ready to generate the images? Let's
          make magic!
        </h2>

        <Button
          data-testid="button-batch-generate-images"
          onClick={handleBatchGenerateImages}
          disabled={isDisabled}
          className="gap-2"
        >
          {batchGenerateImagesMutation.isPending || isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
              {batchGenerateImagesMutation.isPending && hasUnsavedChanges 
                ? "Saving & Generating..." 
                : "Generating All Images..."}
            </>
          ) : allImagesGenerated ? (
            <>Images Generated</>
          ) : (
            <>
              <RefreshCwIcon className="h-4 w-4" />
              {hasUnsavedChanges ? "Save & Generate Images" : "Generate Images"}
            </>
          )}
        </Button>
        
        {hasUnsavedChanges && !isDisabled && (
          <p className="text-xs text-muted-foreground mt-2">
            Unsaved changes will be automatically saved before generation
          </p>
        )}
      </div>
    </div>
  );
};

export default GeneratedStory;
