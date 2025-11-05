import ExampleCard from "@/components/ui/exampleCard";
import React from "react";

const mock = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: "Human & Robot",
  description:
    "Story Description Story Description Story Description Story Description Story Description",
  
}));

export default function ExamplesSection() {
  return (
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
      <section className="max-w-7xl mx-auto px-6 sm:[32px] md:mt-[62px]">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {mock.map((item) => (
            <ExampleCard
              key={item.id}
              image={item.image}
              title={item.title}
              onPreview={() => console.log("preview", item.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
