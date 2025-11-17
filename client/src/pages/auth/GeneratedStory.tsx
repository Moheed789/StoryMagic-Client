"use client";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import StoryPageEditor from "@/components/StoryPageEditor";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchAuthSession } from "aws-amplify/auth";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import CharacterIdentityBox from "@/components/ui/CharacterIdentityBox";

type Story = {
  id: string;
  title: string;
  author?: string | null;
  status?: string;
  totalPages?: number;
  coverImageUrl?: string | null;
};

type PageWithStatus = {
  id: string;
  storyId: string;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string | null;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage?: string | null;
  type?: "COVER_FRONT" | "COVER_BACK" | "PAGE";
};

type StoryDetailsResponse = {
  story: Story;
  pages: PageWithStatus[];
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error?: string | null;
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

  const pages = currentPages || [];

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [unsavedPages, setUnsavedPages] = useState<Set<string>>(new Set());
  const pageEditorsRef = useRef<Map<string, () => Promise<boolean>>>(new Map());
  const pollRef = useRef<number | null>(null);

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
    const maxAttempts = 45;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const id = window.setInterval(async () => {
      try {
        if (!storyId) return;
        const authHeader = await getAuthHeader();
        const res = await fetch(`${API_BASE}/stories/${storyId}/images-status`, {
          headers: { "Content-Type": "application/json", ...authHeader },
        });

        if (res.ok) {
          const data: StoryDetailsResponse = await res.json();
          const pages = data.pages || [];

          setCurrentPages((prevPages: PageWithStatus[] = []) =>
            pages.map((p) => {
              const previous = prevPages.find((prev) => prev.id === p.id);
              return {
                ...previous,
                ...p,
              };
            })
          );

          const anyFailed = pages.some(
            (p) => p.status?.toUpperCase() === "FAILED"
          );
          const allSucceeded =
            pages.length > 0 && pages.every((p) => !!p.imageUrl);

          if (anyFailed) {
            stopPolling();
            setIsGenerating(false);
            toast({
              title: "Image generation failed",
              description:
                "Some or all images failed to generate. Please adjust the prompts and try again.",
              variant: "destructive",
            });
            return;
          }

          if (allSucceeded) {
            stopPolling();
            setIsGenerating(false);
            toast({
              title: "All Images Ready!",
              description:
                "Your story images have been successfully generated.",
            });
            setTimeout(() => navigate("/mystories"), 2000);
            return;
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      if (++attempts > maxAttempts) {
        stopPolling();
        setIsGenerating(false);
      }
    }, 20000);

    pollRef.current = id;
  };

  const saveAllUnsavedPages = async (): Promise<boolean> => {
    if (unsavedPages.size === 0) return true;
    try {
      const savePromises: Promise<boolean>[] = [];
      for (const pageId of Array.from(unsavedPages)) {
        const saveFunction = pageEditorsRef.current.get(pageId);
        if (saveFunction) savePromises.push(saveFunction());
      }
      const results = await Promise.all(savePromises);
      const allSaved = results.every((r) => r === true);
      if (allSaved) {
        setUnsavedPages(new Set());
        toast({
          title: "Auto-save Complete",
          description: "All changes saved before generating images.",
        });
      }
      return allSaved;
    } catch (err) {
      console.error("Error saving pages:", err);
      toast({
        title: "Save Error",
        description: "Some pages could not be saved. Save manually and retry.",
        variant: "destructive",
      });
      return false;
    }
  };

  const batchGenerateImagesMutation = useMutation({
    mutationFn: async () => {
      if (!storyId) throw new Error("Missing storyId");
      const saved = await saveAllUnsavedPages();
      if (!saved) throw new Error("Please save all pages first");
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_BASE}/stories/${storyId}/generate-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          characterDescription: characterDescription?.trim() || undefined,
          targetAge: "3-5 years",
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed with ${res.status}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Images Generating...",
        description: "We'll update you as soon as they’re ready.",
      });
      setIsGenerating(true);
      startStatusPolling();
    },
    onError: (error: any) => {
      console.error("Batch image generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleBatchGenerateImages = () => {
    if (isGenerating || batchGenerateImagesMutation.isPending) return;
    batchGenerateImagesMutation.mutate();
  };

  const allImagesGenerated =
    (currentPages || []).length > 0 &&
    (currentPages || []).every((p) => !!p.imageUrl);

  const hasUnsavedChanges = unsavedPages.size > 0;

  const isDisabled =
    isGenerating ||
    batchGenerateImagesMutation.isPending ||
    !storyId ||
    allImagesGenerated;

  if (!storyId)
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-red-600">No storyId in URL.</p>
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
        </div>

        {pages.map((page: PageWithStatus, index: number) => {
          const total = pages.length;

          const normalizedType: "COVER_FRONT" | "COVER_BACK" | "PAGE" =
            index === 0
              ? "COVER_FRONT"
              : index === total - 1
              ? "COVER_BACK"
              : "PAGE";

          const normalizedPage: PageWithStatus = {
            ...page,
            type: normalizedType,
          };

          return (
            <React.Fragment key={page.id}>
              {index === 0 && (
                <Card className="mb-6">
                  <div className="mt-8">
                    <CharacterIdentityBox
                      storyId={storyId!}
                      isBatchGenerating={
                        isGenerating || batchGenerateImagesMutation.isPending
                      }
                    />
                  </div>
                </Card>
              )}

              <StoryPageEditor
                page={normalizedPage}
                pageIndex={index}
                totalPages={total}
                isBatchGenerating={isGenerating && !page.imageUrl}
              />
            </React.Fragment>
          );
        })}
      </div>

      <div className="bg-card border rounded-lg p-6 max-w-3xl mx-auto mb-8 text-center mt-8">
        <h2 className="mb-4 text-[#8DA99E] font-[600] font-story">
          Ready to generate images?
        </h2>

        <Button
          onClick={handleBatchGenerateImages}
          disabled={isDisabled}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
              Generating Images...
            </>
          ) : allImagesGenerated ? (
            <>Images Generated</>
          ) : (
            <>
              <RefreshCwIcon className="h-4 w-4" /> Generate Images
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GeneratedStory;
