"use client";
import mermaid from "mermaid";
import { useEffect, useRef } from "react";

interface MermaidProps {
  block: any;
}

export function Mermaid({ block }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!block?.properties?.title) return;

    const code = block.properties.title
      .map((t: string[]) => t[0])
      .join("");

    const render = async () => {
      if (ref.current && code) {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark", // or "default"
            flowchart: {
              curve: "basis", // makes edges smooth
              htmlLabels: true, // better text rendering
              useMaxWidth: true,
            },
            securityLevel: "loose", // needed for arrow markers in Next.js
          });

          const { svg } = await mermaid.render("mermaid-" + block.id, code);
          ref.current.innerHTML = svg;
        } catch (err) {
          console.error("Mermaid render error:", err);
        }
      }
    };

    void render();
  }, [block]);

  return <div ref={ref} className="notion-mermaid [&>svg]:w-[1000px] [&>svg]:h-auto" />;
}
