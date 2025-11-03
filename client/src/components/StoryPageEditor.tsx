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
import CharacterIdentityBox from "./ui/CharacterIdentityBox";

type PageType = "COVER_FRONT" | "COVER_BACK" | "PAGE";

interface StoryPage {
  id: string;
  storyId: string;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string | null;
  type?: PageType;
  createdAt?: Date;
  updatedAt?: Date;
  [k: string]: any;
}

interface StoryPageEditorProps {
  page: StoryPage;
  pageIndex?: number;
  totalPages?: number;
  hideStoryText?: boolean;
  onSaved?: (updated: StoryPage) => void;
  isBatchGenerating?: boolean;
  onMarkUnsaved?: () => void;
  onMarkSaved?: () => void;
  onRegisterSaveFunction?: (saveFunction: () => Promise<boolean>) => void;
  onUnregisterSaveFunction?: () => void;
}

const API_BASE = import.meta.env.VITE_BASE_URL;

export default function StoryPageEditor({
  page,
  pageIndex,
  totalPages,
  hideStoryText = false,
  onSaved,
  isBatchGenerating = false,
  onMarkUnsaved,
  onMarkSaved,
  onRegisterSaveFunction,
  onUnregisterSaveFunction,
}: StoryPageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPage, setEditedPage] = useState<StoryPage>(page);
  const [img, setImage] = useState<string | null>(page.imageUrl ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setImage(page.imageUrl ?? null);
    setEditedPage((prev) => ({ ...prev, ...page }));
  }, [page.imageUrl, page.text, page.imagePrompt]);

  useEffect(() => {
    const saveFunction = async (): Promise<boolean> => {
      if (!hasUnsavedChanges) return true;

      try {
        await handleSaveInternal();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    if (onRegisterSaveFunction) {
      onRegisterSaveFunction(saveFunction);
    }

    return () => {
      if (onUnregisterSaveFunction) {
        onUnregisterSaveFunction();
      }
    };
  }, [
    hasUnsavedChanges,
    editedPage,
    onRegisterSaveFunction,
    onUnregisterSaveFunction,
  ]);

  useEffect(() => {
    if (!isEditing) {
      setHasUnsavedChanges(false);
      if (onMarkSaved) {
        onMarkSaved();
      }
      return;
    }

    const hasChanges =
      editedPage.text !== page.text ||
      editedPage.imagePrompt !== page.imagePrompt;

    setHasUnsavedChanges(hasChanges);

    if (hasChanges && onMarkUnsaved) {
      onMarkUnsaved();
    } else if (!hasChanges && onMarkSaved) {
      onMarkSaved();
    }
  }, [
    isEditing,
    editedPage.text,
    editedPage.imagePrompt,
    page.text,
    page.imagePrompt,
    onMarkUnsaved,
    onMarkSaved,
  ]);

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

  const pageNo =
    (page as any)?.pageNumber ??
    (page as any)?.pageNo ??
    editedPage?.pageNumber ??
    (editedPage as any)?.pageNo;

  const handleSaveInternal = async () => {
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

      setError(null);
      setEditedPage(updated);
      setHasUnsavedChanges(false);
      onSaved?.(updated);

      if (onMarkSaved) {
        onMarkSaved();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await handleSaveInternal();
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    setEditedPage(page);
    setIsEditing(false);
    setError(null);
    setHasUnsavedChanges(false);
    if (onMarkSaved) {
      onMarkSaved();
    }
  };

  const persistImageUrl = async (imageUrl: string) => {
    const authHeader = await getAuthHeader();
    const url = `${API_BASE}/stories/${encodeURIComponent(
      storyId
    )}/page/${encodeURIComponent(pageNo)}`;

    const body: Record<string, any> = { imageUrl };

    if (editedPage?.text && editedPage.text.trim()) {
      body.text = editedPage.text;
    }
    if (editedPage?.imagePrompt && editedPage.imagePrompt.trim()) {
      body.imageDescription = editedPage.imagePrompt;
    }
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

  const handleRegenerateImage = async (id: string) => {
    try {
      setIsGenerating(true);
      const authHeader = await getAuthHeader();

      const generateUrl = `${API_BASE}/stories/${id}/pages/${pageNo}/generate-image`;
      await fetch(generateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
      });

      const statusUrl = `${API_BASE}/stories/${id}/pages/${pageNo}/image-status`;

      let imageReady = false;
      let imageUrl: string | null = null;

      for (let attempt = 0; attempt < 15; attempt++) {
        const statusResponse = await fetch(statusUrl, {
          headers: { "Content-Type": "application/json", ...authHeader },
        }).then((res) => res.json());

        if (
          statusResponse?.status === "COMPLETED" &&
          statusResponse?.imageUrl
        ) {
          imageUrl = statusResponse.imageUrl;
          imageReady = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!imageReady || !imageUrl) {
        throw new Error("Image generation timed out. Please try again.");
      }

      await persistImageUrl(imageUrl);
    } catch (e: any) {
      console.error(e?.message || e);
      setError(e?.message || "Failed to regenerate image");
    } finally {
      setIsGenerating(false);
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
  const isFrontCover =
    page.type === "COVER_FRONT" ||
    (typeof pageIndex === "number" && pageIndex === 0);

  const shouldShowLoader = !img && (isGenerating || isBatchGenerating);

  return (
    <>
      <Card>
        {isFrontCover && (
          <div className="mt-8">
            <CharacterIdentityBox storyId={storyId} />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg">{title}</h3>
            {hasUnsavedChanges && isEditing && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Unsaved
              </span>
            )}
          </div>
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
          {/* LEFT column */}
          <div className="space-y-4">
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
                </div>
              )}
            </div>
          </div>

          {/* RIGHT column */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Image Preview</Label>

            <div className="aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden">
              {img ? (
                <img
                  src={img}
                  alt={`Illustration — ${title}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : shouldShowLoader ? (
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
