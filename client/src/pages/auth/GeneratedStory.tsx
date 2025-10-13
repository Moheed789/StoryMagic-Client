// "use client";
// import React, { useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { RefreshCwIcon } from "lucide-react";
// import StoryPageEditor from "@/components/StoryPageEditor";
// import { useMutation } from "@tanstack/react-query";
// import { apiRequest } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { useLocation, useRoute } from "wouter";

// type Story = {
//   id: string;
//   title: string;
//   author?: string | null;
//   status?: string;
//   totalPages?: number;
//   coverImageUrl?: string | null;
// };

// type StoryDetailsResponse = {
//   story: Story;
//   pages: Array<{
//     id: string;
//     storyId: string;
//     pageNumber: number;
//     text: string;
//     imagePrompt: string;
//     imageUrl?: string | null;
//   }>;
// };

// const API_BASE = "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev";

// async function getAuthHeader(): Promise<Record<string, string>> {
//   try {
//     const session: any = await fetchAuthSession();
//     const token = session?.tokens?.idToken?.toString();
//     return token ? { Authorization: `Bearer ${token}` } : {};
//   } catch {
//     return {};
//   }
// }

// const GeneratedStory: React.FC = () => {
//   const [, params] = useRoute("/generated-story/:storyId");
//   const storyId = params?.storyId;
//   const [, navigate] = useLocation();

//   const { characterDescription, setCharacterDescription } = useAuth();
//   const { currentStory, setCurrentPages, currentPages, setCurrentStory } = useAuth() as any;
//   const { toast } = useToast();

//   const [loading, setLoading] = useState<boolean>(true);
//   const [fetchError, setFetchError] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       if (!storyId) return;
//       setLoading(true);
//       setFetchError(null);
//       try {
//         const authHeader = await getAuthHeader();
//         const res = await fetch(`${API_BASE}/stories/${storyId}`, {
//           method: "GET",
//           headers: { "Content-Type": "application/json", ...authHeader },
//         });

//         if (!res.ok) {
//           const text = await res.text().catch(() => "");
//           throw new Error(text || `Failed to fetch story (${res.status})`);
//         }

//         const data = (await res.json()) as StoryDetailsResponse;

//         setCurrentStory?.(data.story);
//         setCurrentPages?.(data.pages || []);

//         setLoading(false);
//       } catch (e: any) {
//         setFetchError(e?.message || "Failed to load story.");
//         setLoading(false);
//       }
//     })();
//   }, [storyId, setCurrentPages, setCurrentStory]);

//   const batchGenerateImagesMutation = useMutation({
//     mutationFn: async () => {
//       if (!currentStory) throw new Error("No story selected");
//       const response = await apiRequest(
//         "POST",
//         `/api/stories/${currentStory.id}/generate-all-images`,
//         {
//           characterDescription: characterDescription?.trim() || undefined,
//         }
//       );
//       return await response.json();
//     },
//     onSuccess: (data) => {
//       setCurrentPages(data.pages);
//       toast({
//         title: "All Images Generated!",
//         description:
//           "Successfully generated images for your story with consistent characters and style.",
//       });
//     },
//     onError: (error) => {
//       console.error("Batch image generation failed:", error);
//       toast({
//         title: "Batch Generation Failed",
//         description:
//           "Failed to generate all images. Please try again or generate them individually.",
//         variant: "destructive",
//       });
//     },
//   });

//   const handleBatchGenerateImages = () => {
//     batchGenerateImagesMutation.mutate();
//   };

//   if (!storyId) {
//     return (
//       <div className="container mx-auto px-6 py-8">
//         <p className="text-red-600">No storyId in URL. Open a generated story link.</p>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="container mx-auto px-6 py-16 text-center">
//         <div className="inline-flex items-center gap-2 text-muted-foreground">
//           <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
//           <span>Loading your story…</span>
//         </div>
//       </div>
//     );
//   }

//   if (fetchError) {
//     return (
//       <div className="container mx-auto px-6 py-16 text-center">
//         <p className="text-red-600 font-medium">Error: {fetchError}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-6 py-8">
//       <div className="max-w-6xl mx-auto space-y-6">
//         <div className="text-center">
//           <h2 className="text-3xl font-display font-bold mb-2">
//             {currentStory?.title || "Edit Your Story"}
//           </h2>
//           <p className="text-sm text-muted-foreground mb-6">
//             {currentStory?.author ? `by ${currentStory.author}` : "Refine your story text and image descriptions."}
//           </p>

//           <div className="text-center mb-6">
//             <div className="bg-card border rounded-lg p-6 max-w-3xl mx-auto">
//               {/* <h3 className="font-semibold mb-2">Character Consistency</h3> */}
//               {/* <p className="text-sm text-muted-foreground mb-4">
//                 Define your main character&apos;s appearance once to ensure they look the same in every illustration.
//               </p> */}

//               {/* <div className="mb-4">
//                 <Label
//                   htmlFor="character-description"
//                   className="text-sm font-semibold mb-2 block text-left"
//                 >
//                   Main Character Description
//                 </Label>
//                 <Textarea
//                   id="character-description"
//                   data-testid="textarea-character-description"
//                   value={characterDescription}
//                   onChange={(e) => setCharacterDescription(e.target.value)}
//                   className="min-h-[10px] resize-none mb-2"
//                   // placeholder="Describe your main character's appearance in detail... (e.g., 'A small bunny with soft white fur, big floppy ears, bright blue eyes, wearing a red scarf and tiny blue boots. Has a gentle, curious expression.')"
//                 />
//                 <p className="text-xs text-muted-foreground text-left">
//                   Be specific about physical features, clothing, colors, and style. This description will be used for all images.
//                 </p>

//               </div> */}

//               <Button
//                 data-testid="button-batch-generate-images"
//                 onClick={handleBatchGenerateImages}
//                 disabled={batchGenerateImagesMutation.isPending || !characterDescription?.trim()}
//                 className="gap-2"
//               >
//                 {batchGenerateImagesMutation.isPending ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
//                     Generating All Images...
//                   </>
//                 ) : (
//                   <>
//                     <RefreshCwIcon className="h-4 w-4" />
//                     Generate All Images with Consistent Character
//                   </>
//                 )}
//               </Button>

//               {/* {!characterDescription?.trim() && (
//                 <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
//                   Please add a character description above to ensure consistency
//                 </p>
//               )} */}
//             </div>
//           </div>
//         </div>

//         {(currentPages || []).map((page: any) => (
//           <StoryPageEditor key={page.id} page={page} />

//         ))}
//       </div>
//     <div className="mt-8 flex justify-end w-full max-w-[89%]">
//   <Button size="lg" onClick={() => navigate("/")}>
//     Done
//   </Button>
// </div>
//     </div>
//   );
// };

// export default GeneratedStory;

"use client";
import React, { useEffect, useState } from "react";
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

const API_BASE = "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev";

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
  const { characterDescription, setCharacterDescription } = useAuth();
  const { currentStory, setCurrentPages, currentPages, setCurrentStory } =
    useAuth() as any;
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  const batchGenerateImagesMutation = useMutation({
    mutationFn: async () => {
      if (!storyId) throw new Error("Missing storyId from route");
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
        description: "We’ll show them as soon as they’re ready.",
      });
      startStatusPolling();
    },
    onError: (error) => {
      console.error("Batch image generation failed:", error);
      toast({
        title: "Batch Generation Failed",
        description: "Failed to generate all images. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const startStatusPolling = async () => {
    let attempts = 0;
    const maxAttempts = 40;
    const interval = setInterval(async () => {
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
            clearInterval(interval);
            toast({
              title: "All Images Ready!",
              description:
                "Your story images have been successfully generated.",
            });
          }
        }
      } catch (err) {
        console.error("Status polling error:", err);
      }

      if (++attempts > maxAttempts) clearInterval(interval);
    }, 5000);
  };

  const handleBatchGenerateImages = () => {
    batchGenerateImagesMutation.mutate();
  };

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

          <div className="bg-card border rounded-lg p-6 max-w-3xl mx-auto mb-8">
            <Button
              data-testid="button-batch-generate-images"
              onClick={handleBatchGenerateImages}
              disabled={batchGenerateImagesMutation.isPending || !storyId}
              className="gap-2"
            >
              {batchGenerateImagesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                  Generating All Images...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="h-4 w-4" />
                  Generate All Images with Consistent Character
                </>
              )}
            </Button>
          </div>
        </div>

        {(currentPages || []).map((page: any) => (
          <StoryPageEditor key={page.id} page={page} />
        ))}
      </div>

      <div className="mt-8 flex justify-end w-full max-w-[89%]">
        <Button size="lg" onClick={() => navigate("/")}>
          Done
        </Button>
      </div>
    </div>
  );
};

export default GeneratedStory;
