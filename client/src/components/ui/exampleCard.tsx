import React from "react";
import { Button } from "./button";
import humanRobot from "../../../public/humanrobot.jpg";

type ExampleCardProps = {
  image: string;
  title: string;
  description?: string;
  onPreview?: () => void;
};

export default function ExampleCard({
  image,
  title,
  description = "Story Description Story Description Story Description Story Description ",
  onPreview,
}: ExampleCardProps) {
  console.log("Rendering ExampleCard with image:", humanRobot);
  return (
    <article className="bg-white rounded-[16px] border  border-[#ECEAF3] shadow-[0_6px_18px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <div className="aspect-[16/10] w-full">
          <img
            src={humanRobot}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="p-6 bg-[#f4f3f7]">
        <h3 className="text-[24px] font-display font-semibold text-[#24212C]">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 text-[12px] leading-5 text-[#7B7A86] line-clamp-2">
            {description}
          </p>
        ) : null}

        <Button onClick={onPreview} className="mt-4 w-full">
          Preview
        </Button>
      </div>
    </article>
  );
}
