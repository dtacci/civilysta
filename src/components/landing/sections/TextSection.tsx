interface TextSectionProps {
  content: {
    title?: string;
    body: string;
    alignment?: "left" | "center" | "right";
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  };
  config: Record<string, unknown>;
}

export function TextSection({ content }: TextSectionProps) {
  const alignment = content.alignment ?? "left";
  const maxWidth = content.maxWidth ?? "lg";

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-none",
  };

  const alignmentClasses = {
    left: "text-left mx-auto",
    center: "text-center mx-auto",
    right: "text-right ml-auto mr-0",
  };

  return (
    <section className="px-4 py-16">
      <div className={`${maxWidthClasses[maxWidth]} ${alignmentClasses[alignment]}`}>
        {content.title && (
          <h2 className="mb-8 text-3xl font-bold md:text-4xl">
            {content.title}
          </h2>
        )}
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      </div>
    </section>
  );
}
