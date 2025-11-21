"use client";
import React, { useState } from "react";
import ExampleCard from "@/components/ui/exampleCard";
import Modal from "@/components/Modal";
import StoryPreviewModal from "@/components/StoryPreviewModal";
import { ChevronRight } from "lucide-react";

const mock = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: "Human & Robot",
  description:
    "A beautifully illustrated fantasy-inspired banner showing an open magical storybook at the center, glowing softly with golden light..A beautifully illustrated fantasy-inspired banner showing an open magical storybook at the center, glowing softly with golden light..A beautifully illustrated fantasy-inspired banner showing an open magical storybook at the center, glowing softly with golden light..",
  image:
    "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=600",
}));

export default function ExamplesSection() {
  const [selectedExample, setSelectedExample] = useState<any>(null);
  const [showMainPreview, setShowMainPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState<"intro" | "pages">("intro");
  const [examplePage, setExamplePage] = useState(0);
  const examplePages = selectedExample
    ? [
        {
          type: "COVER_FRONT",
          title: selectedExample.title,
          author: "AI Generator",
          imageUrl: selectedExample.image,
        },
        ...Array.from({ length: 8 }).map((_, i) => ({
          type: "PAGE",
          pageNumber: i + 1,
          text: `This is example story page ${i + 1}.`,
          imageUrl: selectedExample.image,
        })),

        {
          type: "COVER_BACK",
          text: "The End",
          imageUrl: selectedExample.image,
        },
      ]
    : [];

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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {mock.map((item) => (
              <ExampleCard
                key={item.id}
                image={item.image}
                title={item.title}
                onPreview={() => {
                  setPreviewStep("intro");
                  setExamplePage(0); 
                  setSelectedExample(item);
                  setShowMainPreview(true);
                }}
              />
            ))}
          </div>
        </section>
      </main>
      <Modal
        isOpen={showMainPreview}
        onClose={() => setShowMainPreview(false)}
        maxWidth="max-w-5xl"
      >
        {previewStep === "intro" && selectedExample && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <img
              src={selectedExample.image}
              className="w-full rounded-[20px] object-cover"
              alt="Preview"
            />

            <div>
              <h2 className="text-[32px] sm:text-[46px] font-extrabold mb-[18px] font-display">
                {selectedExample.title}
              </h2>

              <h4 className="font-semibold text-lg mb-[16px]">Given Prompt</h4>

              <p className="bg-[#EFEFEF] px-[16px] pt-[20px] pb-[81px] rounded-xl text-sm text-[#616161]">
                {selectedExample.description}
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
        )}
        {previewStep === "pages" && selectedExample && (
          <StoryPreviewModal
            isOpen={true}
            onClose={() => setShowMainPreview(false)}
            modalStory={{
              storyId: "example-123",
              title: selectedExample?.title,
              totalPages: examplePages.length,
              coverImageUrl: selectedExample?.image,
              pages: examplePages,
            }}
            modalLoading={false}
            currentPage={examplePage}
            setCurrentPage={(p) => setExamplePage(p)}
            disableActions={true} 
          />
        )}
      </Modal>
    </>
  );
}
