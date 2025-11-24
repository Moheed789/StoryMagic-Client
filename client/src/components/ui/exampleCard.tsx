import React from "react";
import { Button } from "./button";

type ExampleCardProps = {
  image: string;
  title: string;
  description?: string;
  onPreview?: () => void;
};

export default function ExampleCard({
  image,
  title,
  description = "",
  onPreview,
}: ExampleCardProps) {
  return (
    <article className="bg-white rounded-[16px] border border-[#ECEAF3] shadow-[0_6px_18px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <div
          className="absolute inset-0 blur-2xl scale-110"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.5,
          }}
        ></div>

        <div className="relative z-10  h-[240px] w-full aspect-[16/10]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="p-6 bg-[#f4f3f7] flex flex-col justify-between">
        <h3 className="text-[24px] font-display font-semibold text-[#24212C]">
          {title}
        </h3>
        <div>
        <Button onClick={onPreview} className="mt-4 w-full">
          Preview
        </Button>
        </div>
      </div>
    </article>
  );
}
