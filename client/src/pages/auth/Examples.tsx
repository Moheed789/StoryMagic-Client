"use client";
import React, { useState, useEffect } from "react";
import ExampleCard from "@/components/ui/exampleCard";
import Modal from "@/components/Modal";
import StoryPreviewModal from "@/components/StoryPreviewModal";
import { ChevronRight, Loader } from "lucide-react";

type ExampleStory = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  coverImageUrl?: string;
  prompt?: string;
  originalPrompt?: string;
  pages?: any[];
  totalPages?: number;
};

export default function ExamplesSection() {
  const [examples, setExamples] = useState<ExampleStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedExample, setSelectedExample] = useState<ExampleStory | null>(
    null
  );
  const [showMainPreview, setShowMainPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState<"intro" | "pages">("intro");
  const [examplePage, setExamplePage] = useState(0);

  const [modalStory, setModalStory] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchExamples = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/stories/examples/list`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to load examples: ${res.status}`);
        }

        const data = await res.json();
        const items: ExampleStory[] = Array.isArray(data?.examples)
          ? data.examples
          : Array.isArray(data?.stories)
          ? data.stories
          : Array.isArray(data)
          ? data
          : [];

        setExamples(
          items.map((item: any, idx) => ({
            id: item.id || item.storyId || String(idx + 1),
            title: item.title || "Untitled Story",
            description:
              item.description || item.prompt || item.originalPrompt || "",
            image:
              item.image ||
              item.coverImageUrl ||
              "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=600",
            coverImageUrl: item.coverImageUrl,
            prompt: item.prompt,
            originalPrompt: item.originalPrompt,
          }))
        );
      } catch (err: any) {
        console.error("Failed to fetch example stories", err);
        setError(err?.message || "Failed to load examples");
      } finally {
        setLoading(false);
      }
    };

    fetchExamples();
  }, []);

  const handleOpenExample = async (item: ExampleStory) => {
    try {
      setPreviewStep("intro");
      setExamplePage(0);
      setShowMainPreview(true);
      setModalLoading(true);
      setSelectedExample(item);
      setModalStory(null);

      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/examples/${item.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch example story");
      }

      const data = await res.json();

      setSelectedExample((prev) => {
        const base = prev || item;
        return {
          ...base,
          title: data.title ?? base.title,
          description:
            data.description ??
            data.prompt ??
            data.originalPrompt ??
            base.description,
          image:
            data.coverImageUrl ??
            data.image ??
            base.image ??
            base.coverImageUrl,
          coverImageUrl: data.coverImageUrl ?? base.coverImageUrl,
          prompt: data.prompt ?? base.prompt,
          originalPrompt: data.originalPrompt ?? base.originalPrompt,
          pages: Array.isArray(data.pages) ? data.pages : base.pages,
          totalPages: data.totalPages ?? base.totalPages,
        };
      });

      setModalStory(data);
    } catch (err) {
      console.error("Failed to fetch example detail", err);
    } finally {
      setModalLoading(false);
    }
  };

  const examplePages =
    modalStory?.pages && Array.isArray(modalStory.pages)
      ? modalStory.pages
      : selectedExample != null
      ? [
          {
            type: "COVER_FRONT",
            title: selectedExample.title,
            author: "AI Generator",
            imageUrl: selectedExample.image || selectedExample.coverImageUrl,
          },
          ...Array.from({ length: 8 }).map((_, i) => ({
            type: "PAGE",
            pageNumber: i + 1,
            text: `This is example story page ${i + 1}.`,
            imageUrl: selectedExample.image || selectedExample.coverImageUrl,
          })),
          {
            type: "COVER_BACK",
            text: "The End",
            imageUrl: selectedExample.image || selectedExample.coverImageUrl,
          },
        ]
      : [];

  const getPromptText = () => {
    const ex = selectedExample;
    if (!ex) return "";
    return (
      ex.description ||
      ex.prompt ||
      ex.originalPrompt ||
      modalStory?.prompt ||
      modalStory?.originalPrompt ||
      "No prompt provided for this example."
    );
  };

  return (
    <>
      <main className="max-w-[1120px] mx-auto px-6 py-12">
        <header className="text-center mb-6">
          <h2 className="text-[40px] md:text-[48px] font-extrabold text-[#27252E] font-display">
            See What You <span className="text-[#8C5AF2]">Can Make</span>
          </h2>
          <p className="text-[12px] md:text-[13px] text-[#8E8A99] mt-2 max-w-[540px] mx-auto">
            Browse sample storybooks with polished illustrations and readable
            pages. Imagine your child’s name on the cover.
          </p>
        </header>

        <section className="max-w-7xl mx-auto px-6 md:mt-[62px]">
          {loading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#F1F0F5] bg-white p-4 animate-pulse"
                >
                  <div className="aspect-[4/3] w-full rounded-xl bg-[#F3F0FA]" />

                  <div className="mt-4 h-4 w-3/4 rounded bg-[#F3F0FA]" />
                  <div className="mt-2 h-3 w-full rounded bg-[#F3F0FA]" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-[#F3F0FA]" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <p className="text-center text-sqm text-red-500">{error}</p>
          )}

          {!loading && !error && examples.length === 0 && (
            <p className="text-center text-sm text-[#8E8A99]">
              No example stories found.
            </p>
          )}

          {!loading && !error && examples.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {examples.map((item) => (
                <ExampleCard
                  key={item.id}
                  image={item.image || item.coverImageUrl || ""}
                  title={item.title}
                  description={item.description}
                  onPreview={() => handleOpenExample(item)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Modal
        isOpen={showMainPreview}
        onClose={() => setShowMainPreview(false)}
        maxWidth="max-w-5xl"
      >
        {previewStep === "intro" &&
          selectedExample &&
          (modalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 animate-pulse">
              {/* Left: image skeleton */}
              <div className="w-full rounded-[20px] bg-[#F3F0FA] aspect-[3/4]" />

              {/* Right: text skeletons */}
              <div className="flex flex-col gap-4">
                {/* Title skeleton */}
                <div className="h-8 w-3/4 rounded bg-[#F3F0FA]" />

                {/* "Given Prompt" heading skeleton */}
                <div className="h-4 w-1/3 rounded bg-[#F3F0FA]" />

                {/* Description box skeleton */}
                <div className="bg-[#EFEFEF] rounded-xl p-4 space-y-2">
                  <div className="h-3 w-full rounded bg-[#F3F0FA]" />
                  <div className="h-3 w-5/6 rounded bg-[#F3F0FA]" />
                  <div className="h-3 w-2/3 rounded bg-[#F3F0FA]" />
                  <div className="h-3 w-1/2 rounded bg-[#F3F0FA]" />
                </div>

                {/* Button skeleton */}
                <div className="mt-2 h-10 w-40 rounded-lg bg-[#F3F0FA]" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              <img
                src={
                  selectedExample.image || selectedExample.coverImageUrl || ""
                }
                className="w-full rounded-[20px] object-cover"
                alt="Preview"
              />

              <div>
                <h2 className="text-[32px] sm:text-[46px] font-extrabold mb-[18px] font-display">
                  {selectedExample.title}
                </h2>

                <h4 className="font-semibold text-lg mb-[16px]">
                  Given Prompt
                </h4>

                <p className="bg-[#EFEFEF] px-[16px] pt-[20px] pb-[81px] rounded-xl text-sm text-[#616161] select-none">
                  {getPromptText()}
                </p>

                <button
                  onClick={() => setPreviewStep("pages")}
                  className="mt-6 bg-[#8C5AF2] text-white py-[10px] px-[36px] rounded-lg flex items-center"
                >
                  Start Preview
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          ))}

        {previewStep === "pages" && selectedExample && (
          <StoryPreviewModal
            isOpen={true}
            onClose={() => setShowMainPreview(false)}
            modalStory={
              modalStory
                ? modalStory
                : {
                    storyId: selectedExample.id,
                    title: selectedExample.title,
                    totalPages: examplePages.length,
                    coverImageUrl:
                      selectedExample.image || selectedExample.coverImageUrl,
                    pages: examplePages,
                  }
            }
            modalLoading={modalLoading}
            currentPage={examplePage}
            setCurrentPage={(p) => setExamplePage(p)}
            disableActions={true}
          />
        )}
      </Modal>
    </>
  );
}
