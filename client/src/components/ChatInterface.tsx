"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SendIcon, SparklesIcon, UserIcon, BookOpenIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAuthSession } from "aws-amplify/auth";
import { Link, useLocation } from "wouter";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface StoryWithPages {
  story: {
    id: string;
    title: string;
    author: string;
    status: string;
    totalPages: number;
  };
  pages: Array<{
    id: string;
    storyId: string;
    pageNumber: number;
    text: string;
    imagePrompt: string;
    imageUrl?: string | null;
  }>;
}

type CartoonStyle = "traditional" | "anime" | "3d" | "chibi";

const safeTrim = (v?: string | null) => (typeof v === "string" ? v.trim() : "");
interface ChatInterfaceProps {
  onStoryGenerated?: (storyData: StoryWithPages) => void;
  selectedCartoonStyle?: CartoonStyle;
}

const API_URL =
  "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories/generate";
const STATUS_BASE_URL =
  "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/";
const STYLE_INDEX: Record<CartoonStyle, number> = {
  traditional: 0,
  anime: 1,
  "3d": 2,
  chibi: 3,
};

export default function ChatInterface({
  onStoryGenerated,
  selectedCartoonStyle,
}: ChatInterfaceProps) {
  const {
    user,
    selectedPageCount,
    setSelectedPageCount,
    storyTitle,
    setStoryTitle,
    authorName,
    setAuthorName,
    setStoryId,
  } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm here to help you create an amazing storybook. What kind of story would you like to create? You can tell me about characters, themes, or just share a simple idea!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    };
  }, []);
  const [loc] = useLocation();

  useEffect(() => {
    if (window.location.hash === "#bottom") {
      requestAnimationFrame(() => {
        document
          .getElementById("bottom")
          ?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [loc]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function getAuthHeader(): Promise<Record<string, string>> {
    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  const INITIAL_DELAY_MS = 30_000;
  const POLL_INTERVAL_MS = 20_000;
  const MAX_ATTEMPTS = 12;

  type CreateResp = { storyId: string };
  type StatusResp = {
    status: "pending" | "processing" | "completed" | "failed" | string;
  };

  const STATUS_URL = (base: string, id: string) =>
    `${base}stories/${id}/status`;
  const STORY_DETAILS_URL = (id: string) =>
    `https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories/${id}`;

  const createStoryMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const authHeader = await getAuthHeader();
      const imageStyleId =
        (selectedCartoonStyle && STYLE_INDEX[selectedCartoonStyle]) ?? 0;
      const payload: Record<string, any> = {
        prompt,
        totalPages: selectedPageCount,
        userId:
          (user as any)?.userId ??
          (user as any)?.sub ??
          (user as any)?.username ??
          undefined,
        imageStyleId,
      };

      const title = safeTrim(storyTitle);
      const author = safeTrim(authorName);
      if (title) payload.title = title;
      if (author) payload.author = author;

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      return (await res.json()) as CreateResp;
    },

    onSuccess: async ({ storyId }) => {
      setStoryId(storyId);

      try {
        await sleep(INITIAL_DELAY_MS);

        let attempt = 0;
        let lastStatus: string | undefined;

        while (attempt < MAX_ATTEMPTS) {
          const authHeader = await getAuthHeader();
          const statusRes = await fetch(STATUS_URL(STATUS_BASE_URL, storyId), {
            method: "GET",
            headers: { "Content-Type": "application/json", ...authHeader },
          });

          if (!statusRes.ok) {
            const text = await statusRes.text().catch(() => "");
            throw new Error(
              text || `Status check failed with ${statusRes.status}`
            );
          }

          const statusJson = (await statusRes.json()) as StatusResp;
          lastStatus = statusJson?.status?.toLowerCase();
          console.log(`Status attempt ${attempt + 1}:`, lastStatus);

          if (lastStatus === "completed") break;
          if (lastStatus === "failed")
            throw new Error("Story generation failed.");

          await sleep(POLL_INTERVAL_MS);
          attempt++;
        }

        if (lastStatus !== "completed") {
          throw new Error("Timed out waiting for completion.");
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            content: "Your story is ready! Redirecting you to your editor...",
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        setTimeout(() => {
          setLocation(`/generated-story/${storyId}`);
        }, 1200);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 4).toString(),
            content:
              err instanceof Error
                ? `Status/Final fetch error: ${err.message}`
                : "Status/Final fetch error. Please try again.",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    },

    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content:
          "you've reached the daily limit of free stories, please generate more stories tomorrow.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim() || createStoryMutation.isPending) return;

    if (!user) {
      setShowLoginModal(true);
      if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
      loginTimerRef.current = setTimeout(
        () => setShowLoginModal(false),
        10_000
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = inputValue.trim();
    setInputValue("");

    createStoryMutation.mutate(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Card
        className="h-[500px] w-full max-w-[1280px] mx-auto flex flex-col "
        id="bottom"
      >
        <div className="p-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Story Assistant</h3>
              <p className="text-xs text-muted-foreground">
                Let's create your storybook together
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.isUser ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={`max-w-[80%] ${
                    message.isUser ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg font-story ${
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {createStoryMutation.isPending && (
              <div className="flex gap-3 ">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 animate-pulse" />
                </div>
                <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm">
                      Creating your magical story...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-card-border">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="page-count" className="text-sm font-medium">
                  Story Length:
                </Label>
              </div>
              <Select
                value={
                  selectedPageCount !== null
                    ? String(selectedPageCount)
                    : undefined
                }
                onValueChange={(v) => setSelectedPageCount(Number(v))}
                disabled={createStoryMutation.isPending}
              >
                <SelectTrigger
                  id="page-count"
                  data-testid="select-page-count"
                  className="w-32"
                >
                  <SelectValue placeholder="Select pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 pages</SelectItem>
                  <SelectItem value="15">15 pages</SelectItem>
                  <SelectItem value="20">20 pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Story Title (e.g., The Brave Little Mouse)"
                value={storyTitle ?? ""}
                onChange={(e) => setStoryTitle(e.target.value)}
                disabled={createStoryMutation.isPending}
              />
              <Input
                placeholder="Author Name"
                value={authorName ?? ""}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={createStoryMutation.isPending}
              />
            </div>

            <div className="flex gap-2">
              <Input
                data-testid="input-story-idea"
                placeholder="Describe your story idea... (e.g., 'A brave little mouse who saves the forest')"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={createStoryMutation.isPending}
                className="font-story"
              />
              <Button
                data-testid="button-send-message"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || createStoryMutation.isPending}
                size="icon"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Be creative and specific for better results
          </p>
        </div>
      </Card>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="w-full max-w-[560px] py-[43px] px-[78px]">
          <DialogHeader>
            <DialogTitle className="text-[30px] font-[400] text-[#8C5AF2] font-display text-center">
              Log In Required
            </DialogTitle>
            <DialogDescription className="text-[18px] font-[500] text-center text-[#6F677E] font-story">
              You need to be signed in to Create a Story. Please log in to
              continue
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="w-full sm:justify-start">
            <Button asChild className="w-full mt-[31px]">
              <Link href="/signin">Sign In</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
