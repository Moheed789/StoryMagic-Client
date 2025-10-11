// "use client";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { EditIcon, ImageIcon, RefreshCwIcon } from "lucide-react";
// import { useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { useAuth } from "@/context/AuthContext";
// import { useRoute } from "wouter";

// type PageType = "COVER_FRONT" | "COVER_BACK" | "PAGE";

// interface StoryPage {
//   id: string;
//   storyId: string;
//   pageNumber: number;
//   text: string;
//   imagePrompt: string;
//   imageUrl?: string | null;
//   type?: PageType;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// interface StoryPageEditorProps {
//   page: StoryPage;
//   pageIndex?: number;
//   totalPages?: number;
//   onRegenerateImage?: (pageId: string) => void;
//   hideStoryText?: boolean;
//   onSaved?: (updated: StoryPage) => void;
// }

// const API_BASE = "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev";

// export default function StoryPageEditor({
//   page,
//   pageIndex,
//   totalPages,
//   onRegenerateImage,
//   hideStoryText = false,
//   onSaved,
// }: StoryPageEditorProps) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [editedPage, setEditedPage] = useState<StoryPage>(page);
//   const [img, setImage] = useState<StoryPage>();
//   console.log({ img });
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleCancel = () => {
//     setEditedPage(page);
//     setIsEditing(false);
//     setError(null);
//   };
//   const {
//     user,
//     selectedPageCount,
//     setSelectedPageCount,
//     storyTitle,
//     setStoryTitle,
//     authorName,
//     setAuthorName,
//   } = useAuth();
//   async function getAuthHeader(): Promise<Record<string, string>> {
//     try {
//       const session: any = await fetchAuthSession();
//       const token = session?.tokens?.idToken?.toString();
//       return token ? { Authorization: `Bearer ${token}` } : {};
//     } catch {
//       return {};
//     }
//   }
//   const [, params] = useRoute("/generated-story/:storyId");
//   const storyId = params?.storyId;

//   const handleRegenerateImage = async (id) => {
//     try {
//       const authHeader = await getAuthHeader();

//       const payload = {
//         prompt,
//         totalPages: selectedPageCount,
//         title: storyTitle,
//         author: authorName,
//         userId: user?.userId ?? user?.sub ?? user?.username ?? undefined,
//       };

//       const apiRequest = async (url: string, options: RequestInit) => {
//         const response = await fetch(url, options);
//         if (!response.ok) {
//           const msg = await response.text().catch(() => "");
//           throw new Error(
//             msg || `Request failed with status ${response.status}`
//           );
//         }
//         return response.json();
//       };

//       const generateUrl = `${API_BASE}/stories/${id}/pages/${selectedPageCount}/generate-image`;

//       await apiRequest(generateUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", ...authHeader },
//         body: JSON.stringify(payload),
//       });

//       const statusUrl = `${API_BASE}/stories/${id}/pages/${selectedPageCount}/image-status`;

//       const statusResponse = await apiRequest(statusUrl, {
//         method: "GET",
//         headers: { "Content-Type": "application/json", ...authHeader },
//       });

//       console.log("✅ Image status:", statusResponse);

//       if (statusResponse?.imageUrl) {
//         const imageResponse = await fetch(statusResponse.imageUrl, {
//           method: "GET",
//         });
//         setImage(imageResponse?.url);
//         // if (!imageResponse.ok)
//         //   throw new Error(`Failed to fetch image: ${imageResponse.status}`);

//         // const blob = await imageResponse.blob();
//       }
//     } catch (error: any) {
//       console.error("❌ Image regeneration failed:", error.message || error);
//     }
//   };

//   const getPageTitle = () => {
//     if (page.type === "COVER_FRONT") return "Front Cover";
//     if (page.type === "COVER_BACK") return "Back Cover";

//     if (typeof pageIndex === "number" && typeof totalPages === "number") {
//       if (pageIndex === 0) return "Front Cover";
//       if (pageIndex === totalPages - 1) return "Back Cover";
//     }

//     return `Page ${page?.pageNo}`;
//   };

//   const title = getPageTitle();

//   const handleSave = async () => {
//     setIsSaving(true);
//     setError(null);
//     try {
//       let authHeader: Record<string, string> = {};
//       try {
//         const session: any = await fetchAuthSession();
//         const token = session?.tokens?.idToken?.toString();
//         if (token) authHeader = { Authorization: "Bearer " + token };
//       } catch {}

//       const url = `${API_BASE}/stories/${encodeURIComponent(
//         page.storyId
//       )}/page/${page?.pageNo}`;

//       const payload = {
//         text: editedPage.text,
//         imagePrompt: editedPage.imagePrompt,
//         imageDescription: editedPage.imagePrompt,
//       };

//       const res = await fetch(url, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           ...authHeader,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const msg = await res.text().catch(() => "");
//         throw new Error(msg || `Request failed with status ${res.status}`);
//       }
//       const updated = (await res.json().catch(() => null)) || {
//         ...page,
//         ...payload,
//         updatedAt: new Date(),
//       };

//       setIsEditing(false);
//       setError(null);

//       setEditedPage(updated);
//       onSaved?.(updated);
//     } catch (e: any) {
//       setError(e?.message || "Failed to save changes");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Card className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="font-display font-bold text-lg">{getPageTitle()}</h3>
//         <div className="flex gap-2">
//           {!isEditing ? (
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setIsEditing(true)}
//               className="gap-1"
//             >
//               <EditIcon className="h-3 w-3" />
//               Edit
//             </Button>
//           ) : (
//             <>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleCancel}
//                 disabled={isSaving}
//               >
//                 Cancel
//               </Button>
//               <Button size="sm" onClick={handleSave} disabled={isSaving}>
//                 {isSaving ? "Saving..." : "Save"}
//               </Button>
//             </>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
//           {error}
//         </div>
//       )}

//       <div className="grid lg:grid-cols-2 gap-6">
//         <div className="space-y-4">
//           {!hideStoryText && (
//             <div>
//               <Label className="text-sm font-semibold mb-2 block">
//                 Story Text
//               </Label>
//               {isEditing ? (
//                 <Textarea
//                   value={editedPage.text}
//                   onChange={(e) =>
//                     setEditedPage({ ...editedPage, text: e.target.value })
//                   }
//                   className="min-h-[120px] resize-none"
//                   placeholder="Write the story text for this page..."
//                   disabled={isSaving}
//                 />
//               ) : (
//                 <div className="p-3 bg-muted/30 rounded-md min-h-[120px]">
//                   {editedPage.text ? (
//                     editedPage.text
//                   ) : (
//                     <span className="text-muted-foreground italic">
//                       No text yet...
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           <div>
//             <Label className="text-sm font-semibold mb-2 block">
//               Image Description
//             </Label>
//             {isEditing ? (
//               <div className="space-y-2">
//                 <Textarea
//                   value={editedPage.imagePrompt}
//                   onChange={(e) =>
//                     setEditedPage({
//                       ...editedPage,
//                       imagePrompt: e.target.value,
//                     })
//                   }
//                   className="min-h-[80px] resize-none"
//                   placeholder="Describe the illustration for this page..."
//                   disabled={isSaving}
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   Be specific about characters, setting, mood, and style for
//                   best results.
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 <div className="p-3 bg-muted/30 rounded-md min-h-[80px]">
//                   {editedPage.imagePrompt ? (
//                     editedPage.imagePrompt
//                   ) : (
//                     <span className="text-muted-foreground italic">
//                       No image description yet...
//                     </span>
//                   )}
//                 </div>
//                 {editedPage.imagePrompt && (
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleRegenerateImage(page?.storyId)}
//                     className="gap-1"
//                   >
//                     <RefreshCwIcon className="h-3 w-3" />
//                     {editedPage.imageUrl
//                       ? "Regenerate Image"
//                       : "Generate Image"}
//                   </Button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="space-y-4">
//           <Label className="text-sm font-semibold">Image Preview</Label>
//           <div className="aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
//             {editedPage.imageUrl ? (
//               <img
//                 src={img}
//                 alt={`Illustration — ${title}`}
//                 className="w-full h-full object-cover rounded-lg"
//               />
//             ) : (
//               <div className="text-center text-muted-foreground">
//                 <ImageIcon className="h-12 w-12 mx-auto mb-2" />
//                 <p className="text-sm">Image will appear here</p>
//                 <p className="text-xs">after generation</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// }

// "use client";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { EditIcon, ImageIcon, RefreshCwIcon } from "lucide-react";
// import { useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";
// import { useAuth } from "@/context/AuthContext";
// import { useRoute } from "wouter";

// type PageType = "COVER_FRONT" | "COVER_BACK" | "PAGE";

// interface StoryPage {
//   id: string;
//   storyId: string;
//   pageNumber: number;
//   text: string;
//   imagePrompt: string;
//   imageUrl?: string | null;
//   type?: PageType;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// interface StoryPageEditorProps {
//   page: StoryPage;
//   pageIndex?: number;
//   totalPages?: number;
//   onRegenerateImage?: (pageId: string) => void;
//   hideStoryText?: boolean;
//   onSaved?: (updated: StoryPage) => void;
// }

// const API_BASE = "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev";

// export default function StoryPageEditor({
//   page,
//   pageIndex,
//   totalPages,
//   hideStoryText = false,
//   onSaved,
// }: StoryPageEditorProps) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [editedPage, setEditedPage] = useState<StoryPage>(page);
//   const [img, setImage] = useState<string | null>(page.imageUrl ?? null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const { user, selectedPageCount, storyTitle, authorName } = useAuth();

//   const [, params] = useRoute("/generated-story/:storyId");
//   const storyId = params?.storyId;

//   async function getAuthHeader(): Promise<Record<string, string>> {
//     try {
//       const session: any = await fetchAuthSession();
//       const token = session?.tokens?.idToken?.toString();
//       return token ? { Authorization: `Bearer ${token}` } : {};
//     } catch {
//       return {};
//     }
//   }

//   // 🖼️ Handle Image Regeneration
//   // const handleRegenerateImage = async (id: string) => {
//   //   try {
//   //     setIsGenerating(true);
//   //     const authHeader = await getAuthHeader();

//   //     // Step 1 — Trigger image generation
//   //     const generateUrl = `${API_BASE}/stories/${id}/pages/${selectedPageCount}/generate-image`;
//   //     await fetch(generateUrl, {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json", ...authHeader },
//   //     });

//   //     // Step 2 — Fetch status to get image URL
//   //     const statusUrl = `${API_BASE}/stories/${id}/pages/${selectedPageCount}/image-status`;
//   //     const statusResponse = await fetch(statusUrl, {
//   //       headers: { "Content-Type": "application/json", ...authHeader },
//   //     }).then((res) => res.json());

//   //     console.log("✅ Image status:", statusResponse);

//   //     if (statusResponse?.imageUrl) {
//   //       setImage(statusResponse.imageUrl);
//   //       setEditedPage((prev) => ({
//   //         ...prev,
//   //         imageUrl: statusResponse.imageUrl,
//   //       }));
//   //     } else {
//   //       throw new Error("No image URL found in status response");
//   //     }
//   //   } catch (error: any) {
//   //     console.error("❌ Image regeneration failed:", error.message || error);
//   //     setError(error.message || "Failed to regenerate image");
//   //   } finally {
//   //     setIsGenerating(false);
//   //   }
//   // };

//   const handleRegenerateImage = async (id: string) => {
//     try {
//       setIsGenerating(true);
//       const authHeader = await getAuthHeader();

//       // Step 1 — Trigger image generation
//       const generateUrl = `${API_BASE}/stories/${id}/pages/${selectedPageCount}/generate-image`;
//       await fetch(generateUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", ...authHeader },
//       });

//       // Step 2 — Poll status until COMPLETE
//       const statusUrl = `${API_BASE}/stories/${id}/pages/${selectedPageCount}/image-status`;

//       let imageReady = false;
//       let imageUrl: string | null = null;

//       for (let attempt = 0; attempt < 15; attempt++) {
//         // ⏳ up to ~30s (15 x 2s)
//         const statusResponse = await fetch(statusUrl, {
//           headers: { "Content-Type": "application/json", ...authHeader },
//         }).then((res) => res.json());

//         console.log("Image status:", statusResponse);

//         if (statusResponse.status === "COMPLETED" && statusResponse.imageUrl) {
//           imageUrl = statusResponse.imageUrl;
//           imageReady = true;
//           break;
//         }

//         // wait 2 seconds before next check
//         await new Promise((r) => setTimeout(r, 2000));
//       }

//       if (!imageReady) {
//         throw new Error("Image generation timed out. Please try again.");
//       }

//       // ✅ Step 3 — Update preview
//       setImage(imageUrl);
//       setEditedPage((prev) => ({ ...prev, imageUrl }));

//       // ✅ Step 4 — Persist in backend (so it survives refresh)
//       try {
//         const saveUrl = `${API_BASE}/stories/${id}/page/${selectedPageCount}`;
//         await fetch(saveUrl, {
//           method: "PUT",
//           headers: { "Content-Type": "application/json", ...authHeader },
//           body: JSON.stringify({ imageUrl }),
//         });
//         console.log("✅ Image URL saved to backend");
//       } catch (e) {
//         console.warn("⚠️ Failed to persist imageUrl:", e);
//       }

//       // ✅ Step 3 — Update preview and page
//       setImage(imageUrl);
//       setEditedPage((prev) => ({ ...prev, imageUrl }));
//     } catch (error: any) {
//       console.error("❌ Image regeneration failed:", error.message || error);
//       setError(error.message || "Failed to regenerate image");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleCancel = () => {
//     setEditedPage(page);
//     setIsEditing(false);
//     setError(null);
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
//     setError(null);
//     try {
//       const authHeader = await getAuthHeader();

//       const url = `${API_BASE}/stories/${encodeURIComponent(
//         page.storyId
//       )}/page/${page?.pageNo}`;

//       const payload = {
//         text: editedPage.text,
//         imagePrompt: editedPage.imagePrompt,
//         imageDescription: editedPage.imagePrompt,
//         imageUrl: editedPage.imageUrl,
//       };

//       const res = await fetch(url, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           ...authHeader,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const msg = await res.text().catch(() => "");
//         throw new Error(msg || `Request failed with status ${res.status}`);
//       }

//       const updated = (await res.json().catch(() => null)) || {
//         ...page,
//         ...payload,
//         updatedAt: new Date(),
//       };

//       setIsEditing(false);
//       setError(null);
//       setEditedPage(updated);
//       onSaved?.(updated);
//     } catch (e: any) {
//       setError(e?.message || "Failed to save changes");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const getPageTitle = () => {
//     if (page.type === "COVER_FRONT") return "Front Cover";
//     if (page.type === "COVER_BACK") return "Back Cover";

//     if (typeof pageIndex === "number" && typeof totalPages === "number") {
//       if (pageIndex === 0) return "Front Cover";
//       if (pageIndex === totalPages - 1) return "Back Cover";
//     }

//     return `Page ${page?.pageNo}`;
//   };

//   const title = getPageTitle();

//   return (
//     <Card className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="font-display font-bold text-lg">{title}</h3>
//         <div className="flex gap-2">
//           {!isEditing ? (
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setIsEditing(true)}
//               className="gap-1"
//             >
//               <EditIcon className="h-3 w-3" />
//               Edit
//             </Button>
//           ) : (
//             <>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleCancel}
//                 disabled={isSaving}
//               >
//                 Cancel
//               </Button>
//               <Button size="sm" onClick={handleSave} disabled={isSaving}>
//                 {isSaving ? "Saving..." : "Save"}
//               </Button>
//             </>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
//           {error}
//         </div>
//       )}

//       <div className="grid lg:grid-cols-2 gap-6">
//         <div className="space-y-4">
//           {/* {!hideStoryText && (
//             <div>
//               <Label className="text-sm font-semibold mb-2 block">
//                 Story Text
//               </Label>
//               {isEditing ? (
//                 <Textarea
//                   value={editedPage.text}
//                   onChange={(e) =>
//                     setEditedPage({ ...editedPage, text: e.target.value })
//                   }
//                   className="min-h-[120px] resize-none"
//                   placeholder="Write the story text for this page..."
//                   disabled={isSaving}
//                 />
//               ) : (
//                 <div className="p-3 bg-muted/30 rounded-md min-h-[120px]">
//                   {editedPage.text ? (
//                     editedPage.text
//                   ) : (
//                     <span className="text-muted-foreground italic">
//                       No text yet...
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           )} */}

//           {!hideStoryText &&
//             page.type !== "COVER_FRONT" &&
//             page.type !== "COVER_BACK" && (
//               <div>
//                 <Label className="text-sm font-semibold mb-2 block">
//                   Story Text
//                 </Label>
//                 {isEditing ? (
//                   <Textarea
//                     value={editedPage.text}
//                     onChange={(e) =>
//                       setEditedPage({ ...editedPage, text: e.target.value })
//                     }
//                     className="min-h-[120px] resize-none"
//                     placeholder="Write the story text for this page..."
//                     disabled={isSaving}
//                   />
//                 ) : (
//                   <div className="p-3 bg-muted/30 rounded-md min-h-[120px]">
//                     {editedPage.text ? (
//                       editedPage.text
//                     ) : (
//                       <span className="text-muted-foreground italic">
//                         No text yet...
//                       </span>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}

//           <div>
//             <Label className="text-sm font-semibold mb-2 block">
//               Image Description
//             </Label>
//             {isEditing ? (
//               <div className="space-y-2">
//                 <Textarea
//                   value={editedPage.imagePrompt}
//                   onChange={(e) =>
//                     setEditedPage({
//                       ...editedPage,
//                       imagePrompt: e.target.value,
//                     })
//                   }
//                   className="min-h-[80px] resize-none"
//                   placeholder="Describe the illustration for this page..."
//                   disabled={isSaving}
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   Be specific about characters, setting, mood, and style for
//                   best results.
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 <div className="p-3 bg-muted/30 rounded-md min-h-[80px]">
//                   {editedPage.imagePrompt ? (
//                     editedPage.imagePrompt
//                   ) : (
//                     <span className="text-muted-foreground italic">
//                       No image description yet...
//                     </span>
//                   )}
//                 </div>
//                 {editedPage.imagePrompt && (
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleRegenerateImage(page?.storyId)}
//                     className="gap-1"
//                     disabled={isGenerating}
//                   >
//                     {isGenerating ? (
//                       <>
//                         <RefreshCwIcon className="h-3 w-3 animate-spin" />
//                         Generating...
//                       </>
//                     ) : (
//                       <>
//                         <RefreshCwIcon className="h-3 w-3" />
//                         {img ? "Regenerate Image" : "Generate Image"}
//                       </>
//                     )}
//                   </Button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Image Preview Section */}
//         <div className="space-y-4">
//           <Label className="text-sm font-semibold">Image Preview</Label>
//           <div className="aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
//             {img ? (
//               <img
//                 src={img}
//                 alt={`Illustration — ${title}`}
//                 className="w-full h-full object-cover rounded-lg"
//               />
//             ) : isGenerating ? (
//               <div className="text-center text-muted-foreground">
//                 <RefreshCwIcon className="h-8 w-8 mx-auto mb-2 animate-spin" />
//                 <p className="text-sm">Generating image...</p>
//               </div>
//             ) : (
//               <div className="text-center text-muted-foreground">
//                 <ImageIcon className="h-12 w-12 mx-auto mb-2" />
//                 <p className="text-sm">Image will appear here</p>
//                 <p className="text-xs">after generation</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// }


"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EditIcon, ImageIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useAuth } from "@/context/AuthContext";
import { useRoute } from "wouter";

type PageType = "COVER_FRONT" | "COVER_BACK" | "PAGE";

interface StoryPage {
  id: string;
  storyId: string;
  pageNumber: number;            // backend canonical number
  text: string;
  imagePrompt: string;           // UI term
  imageUrl?: string | null;
  type?: PageType;
  createdAt?: Date;
  updatedAt?: Date;
  // Some responses might send pageNo instead of pageNumber:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

interface StoryPageEditorProps {
  page: StoryPage;
  pageIndex?: number;
  totalPages?: number;
  hideStoryText?: boolean;
  onSaved?: (updated: StoryPage) => void;
}

const API_BASE = "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev";

export default function StoryPageEditor({
  page,
  pageIndex,
  totalPages,
  hideStoryText = false,
  onSaved,
}: StoryPageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPage, setEditedPage] = useState<StoryPage>(page);
  const [img, setImage] = useState<string | null>(page.imageUrl ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate preview if parent refetches page with a persisted imageUrl
  useEffect(() => {
    if (page.imageUrl) setImage(page.imageUrl);
  }, [page.imageUrl]);

  const { selectedPageCount } = useAuth(); // kept if you need elsewhere

  const [, params] = useRoute("/generated-story/:storyId");
  const storyId = params?.storyId ?? page.storyId;

  async function getAuthHeader(): Promise<Record<string, string>> {
    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  // Resolve the actual page number used in URLs
  const pageNo =
    (page as any)?.pageNumber ??
    (page as any)?.pageNo ??
    editedPage?.pageNumber ??
    (editedPage as any)?.pageNo;

  // Persist imageUrl (backend validator requires text or imageDescription)
  const persistImageUrl = async (imageUrl: string) => {
    const authHeader = await getAuthHeader();
    const url = `${API_BASE}/stories/${encodeURIComponent(
      storyId
    )}/page/${encodeURIComponent(pageNo)}`;

    const body: Record<string, any> = { imageUrl };

    if (editedPage?.text && editedPage.text.trim()) {
      body.text = editedPage.text;
    }
    // Backend expects `imageDescription`; UI field is `imagePrompt`
    if (editedPage?.imagePrompt && editedPage.imagePrompt.trim()) {
      body.imageDescription = editedPage.imagePrompt;
    }
    // Ensure validator passes even if both are empty
    if (!body.text && !body.imageDescription) {
      body.imageDescription = editedPage?.imagePrompt || "Auto-saved image";
    }

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `Persist image failed with status ${res.status}`);
    }

    const updated = (await res.json().catch(() => null)) || {
      ...editedPage,
      ...body,
      updatedAt: new Date(),
    };

    setEditedPage(updated);
    setImage(imageUrl);
    onSaved?.(updated);
  };

  // Generate image, poll status, persist URL
  const handleRegenerateImage = async (id: string) => {
    try {
      setIsGenerating(true);
      const authHeader = await getAuthHeader();

      // 1) Trigger generation
      const generateUrl = `${API_BASE}/stories/${id}/pages/${pageNo}/generate-image`;
      await fetch(generateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
      });

      // 2) Poll status until COMPLETED (max ~30s)
      const statusUrl = `${API_BASE}/stories/${id}/pages/${pageNo}/image-status`;

      let imageReady = false;
      let imageUrl: string | null = null;

      for (let attempt = 0; attempt < 15; attempt++) {
        const statusResponse = await fetch(statusUrl, {
          headers: { "Content-Type": "application/json", ...authHeader },
        }).then((res) => res.json());

        if (statusResponse?.status === "COMPLETED" && statusResponse?.imageUrl) {
          imageUrl = statusResponse.imageUrl;
          imageReady = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!imageReady || !imageUrl) {
        throw new Error("Image generation timed out. Please try again.");
      }

      // 3) Persist & update UI
      await persistImageUrl(imageUrl);
    } catch (e: any) {
      console.error("❌ Image regeneration failed:", e?.message || e);
      setError(e?.message || "Failed to regenerate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setEditedPage(page);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const authHeader = await getAuthHeader();

      const url = `${API_BASE}/stories/${encodeURIComponent(
        storyId
      )}/page/${encodeURIComponent(pageNo)}`;

      const payload = {
        text: editedPage.text,
        imagePrompt: editedPage.imagePrompt,
        imageDescription: editedPage.imagePrompt,
        imageUrl: editedPage.imageUrl,
      };

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Request failed with status ${res.status}`);
      }

      const updated = (await res.json().catch(() => null)) || {
        ...page,
        ...payload,
        updatedAt: new Date(),
      };

      setIsEditing(false);
      setError(null);
      setEditedPage(updated);
      onSaved?.(updated);
    } catch (e: any) {
      setError(e?.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const getPageTitle = () => {
    if (page.type === "COVER_FRONT") return "Front Cover";
    if (page.type === "COVER_BACK") return "Back Cover";
    if (typeof pageIndex === "number" && typeof totalPages === "number") {
      if (pageIndex === 0) return "Front Cover";
      if (pageIndex === totalPages - 1) return "Back Cover";
    }
    return `Page ${pageNo}`;
  };

  const title = getPageTitle();

  return (
    <>
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg">{title}</h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1"
            >
              <EditIcon className="h-3 w-3" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Hide story text on covers */}
          {!hideStoryText &&
            page.type !== "COVER_FRONT" &&
            page.type !== "COVER_BACK" && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Story Text
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editedPage.text}
                    onChange={(e) =>
                      setEditedPage({ ...editedPage, text: e.target.value })
                    }
                    className="min-h-[120px] resize-none"
                    placeholder="Write the story text for this page..."
                    disabled={isSaving}
                  />
                ) : (
                  <div className="p-3 bg-muted/30 rounded-md min-h-[120px]">
                    {editedPage.text ? (
                      editedPage.text
                    ) : (
                      <span className="text-muted-foreground italic">
                        No text yet...
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Image Description
            </Label>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedPage.imagePrompt}
                  onChange={(e) =>
                    setEditedPage({
                      ...editedPage,
                      imagePrompt: e.target.value,
                    })
                  }
                  className="min-h-[80px] resize-none"
                  placeholder="Describe the illustration for this page..."
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about characters, setting, mood, and style for
                  best results.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-muted/30 rounded-md min-h-[80px]">
                  {editedPage.imagePrompt ? (
                    editedPage.imagePrompt
                  ) : (
                    <span className="text-muted-foreground italic">
                      No image description yet...
                    </span>
                  )}
                </div>
                {editedPage.imagePrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateImage(storyId)}
                    className="gap-1"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCwIcon className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCwIcon className="h-3 w-3" />
                        {img ? "Regenerate Image" : "Generate Image"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image Preview */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Image Preview</Label>
          <div className="aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
            {img ? (
              <img
                src={img}
                alt={`Illustration — ${title}`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : isGenerating ? (
              <div className="text-center text-muted-foreground">
                <RefreshCwIcon className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Generating image...</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Image will appear here</p>
                <p className="text-xs">after generation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
    </>

  );
}
