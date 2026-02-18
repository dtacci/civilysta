export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  config: {
    title: string;
    description: string;
    template: string;
    primaryColor: string;
    secondaryColor: string;
  };
  sections: Array<{
    type: "HERO" | "TEXT" | "CTA";
    order: number;
    content: Record<string, unknown>;
  }>;
}

export const CIVIC_CAUSE_TEMPLATE: LandingPageTemplate = {
  id: "civic-cause",
  name: "Civic Cause",
  description: "Standard civic cause page with hero, about section, and call-to-action",
  config: {
    title: "Your Cause Title",
    description: "A brief description of your cause",
    template: "civic-cause",
    primaryColor: "#3b82f6",
    secondaryColor: "#60a5fa",
  },
  sections: [
    {
      type: "HERO",
      order: 0,
      content: {
        headline: "Make a Difference in Your Community",
        subheadline: "Join our cause to create positive change",
        description:
          "Together, we can build a better future for everyone. Your voice matters and your support makes a real difference.",
        ctaText: "Support This Cause",
        ctaUrl: "#support",
        showSupporters: true,
        supporterCount: 0,
      },
    },
    {
      type: "TEXT",
      order: 1,
      content: {
        title: "About This Cause",
        body: `<p>Our community faces important challenges that require collective action.</p>
<h3>What We're Asking For</h3>
<ul>
  <li>Action item one</li>
  <li>Action item two</li>
  <li>Action item three</li>
</ul>
<p>Every person who gets involved brings us closer to our goals.</p>`,
        alignment: "left",
        maxWidth: "lg",
      },
    },
    {
      type: "CTA",
      order: 2,
      content: {
        title: "Ready to Make a Difference?",
        description:
          "Join others who are working to create positive change in our community.",
        primaryCTA: {
          text: "Support This Cause",
          url: "#support",
          style: "primary",
        },
        secondaryCTA: {
          text: "Share",
          url: "#share",
          style: "outline",
        },
        style: "banner",
      },
    },
  ],
};

export const PETITION_TEMPLATE: LandingPageTemplate = {
  id: "petition",
  name: "Petition",
  description: "Focused on gathering signatures with a progress bar",
  config: {
    title: "Sign the Petition",
    description: "Add your name to make a difference",
    template: "petition",
    primaryColor: "#10b981",
    secondaryColor: "#34d399",
  },
  sections: [
    {
      type: "HERO",
      order: 0,
      content: {
        headline: "Sign the Petition",
        subheadline: "Your signature matters",
        description: "Add your name and help us reach our goal.",
        ctaText: "Sign Now",
        ctaUrl: "#support",
        showSupporters: true,
        supporterCount: 0,
        supporterGoal: 1000,
      },
    },
    {
      type: "TEXT",
      order: 1,
      content: {
        title: "Why This Matters",
        body: "<p>Explain why people should sign this petition and what impact their signature will have.</p>",
        alignment: "left",
        maxWidth: "lg",
      },
    },
    {
      type: "CTA",
      order: 2,
      content: {
        title: "Add Your Name",
        description: "Stand with us.",
        primaryCTA: {
          text: "Sign the Petition",
          url: "#support",
          style: "primary",
        },
        style: "card",
      },
    },
  ],
};

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  CIVIC_CAUSE_TEMPLATE,
  PETITION_TEMPLATE,
];

export function getTemplateById(id: string): LandingPageTemplate | null {
  return LANDING_PAGE_TEMPLATES.find((t) => t.id === id) ?? null;
}
