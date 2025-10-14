"use client";
import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshCwIcon } from "lucide-react";
import StoryPageEditor from "@/components/StoryPageEditor";

interface StoryPage {
  id: string;
  storyId: string;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string | null;
}
interface Story {
  id: string;
  title: string;
  author: string;
  status: string;
  totalPages: number;
}

export default function EditStoryPage() {
  const [, params] = useRoute("/stories/:storyId/edit");
  const storyId = params?.storyId!;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [characterDescription, setCharacterDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", `/api/stories/${storyId}`);
        const data = await res.json();
        setStory(data.story);
        setPages(data.pages);
      } catch (e) {
        toast({
          title: "Load failed",
          description: "Story fetch mein issue.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [storyId]);

  const handlePageUpdate = async (updated: StoryPage) => {
    try {
      const res = await apiRequest(
        "PATCH",
        `/api/stories/${storyId}/pages/${updated.id}`,
        {
          text: updated.text,
          imagePrompt: updated.imagePrompt,
        }
      );
      const saved = await res.json();
      setPages((p) => p.map((pg) => (pg.id === saved.id ? saved : pg)));
      toast({ title: "Saved", description: "Page update ho gaya ✅" });
    } catch (e) {
      toast({
        title: "Save failed",
        description: "Dobara koshish karein.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateImage = async (pageId: string) => {
    try {
      const res = await apiRequest(
        "POST",
        `/api/stories/${storyId}/pages/${pageId}/generate-image`,
        {}
      );
      const data = await res.json();
      setPages((p) => p.map((pg) => (pg.id === data.page.id ? data.page : pg)));
      toast({
        title: "Image updated",
        description: "Image regenerate ho gayi 🎨",
      });
    } catch (e) {
      toast({
        title: "Generation failed",
        description: "Image generate nahi hui.",
        variant: "destructive",
      });
    }
  };

  const [batching, setBatching] = useState(false);
  const handleBatchGenerateImages = async () => {
    if (!characterDescription.trim()) return;
    try {
      setBatching(true);
      const res = await apiRequest(
        "POST",
        `/api/stories/${storyId}/generate-all-images`,
        {
          characterDescription: characterDescription.trim(),
        }
      );
      const data = await res.json();
      setPages(data.pages);
      toast({
        title: "All images done!",
        description: "Consistent characters applied ✨",
      });
    } catch (e) {
      toast({
        title: "Batch failed",
        description: "Phir koshish karein.",
        variant: "destructive",
      });
    } finally {
      setBatching(false);
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;
  if (!story) return <div className="p-8">Story nahi mili.</div>;

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
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Chat
            </button>
            <button
              onClick={() => navigate(`/stories/${storyId}/preview`)}
              className="bg-primary text-primary-foreground px-4 py-1 rounded-lg text-sm font-medium"
            >
              Preview Story →
            </button>
          </div>
          <div className="text-center mb-6">
            <div className="bg-card border rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="font-semibold mb-2">Character Consistency</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define your main character once so they look the same across all
                images.
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
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  className="min-h-[100px] resize-none mb-2"
                  placeholder="e.g., A small bunny with soft white fur…"
                />
                <p className="text-xs text-muted-foreground text-left">
                  Be specific about physical features, clothing, colors, and
                  style.
                </p>
              </div>

              <Button
                onClick={handleBatchGenerateImages}
                disabled={batching || !characterDescription.trim()}
                className="gap-2"
              >
                {batching ? (
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
                <p className="text-xs text-amber-600 mt-2">
                  Please add a character description above to ensure consistency
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <StoryPageEditor
            page={pages[0]}
            onPageUpdate={handlePageUpdate}
            onRegenerateImage={handleRegenerateImage}
            hideStoryText={true}
            customTitle="Front Cover"
          />
        </div>

        {pages.map((p, idx) => (
          <div key={p.id} className="mb-6">
            <StoryPageEditor
              page={p}
              pageIndex={idx}
              totalPages={pages.length}
              onPageUpdate={handlePageUpdate}
              onRegenerateImage={handleRegenerateImage}
              hideStoryText={idx === 0 || idx === pages.length - 1}
            />
          </div>
        ))}

        <div className="mb-6">
          <StoryPageEditor
            page={pages[pages.length - 1]}
            onPageUpdate={handlePageUpdate}
            onRegenerateImage={handleRegenerateImage}
            hideStoryText={true}
            customTitle="Back Cover"
          />
        </div>
      </div>
    </div>
  );
}
