import { NextSeo } from "next-seo";
import { APP_CONFIG } from "@config/app.config";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    url?: string;
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    handle?: string;
    site?: string;
    cardType?: string;
  };
}

export function SEO({ title, description, canonical, openGraph, twitter }: SEOProps) {
  const seoTitle = title ? `${title} | ${APP_CONFIG.name}` : APP_CONFIG.name;
  const seoDescription = description || APP_CONFIG.description;

  return (
    <NextSeo
      title={seoTitle}
      description={seoDescription}
      canonical={canonical || "https://llama-runner.example.com"}
      openGraph={{
        type: "website",
        locale: "en_US",
        url: openGraph?.url || "https://llama-runner.example.com",
        title: openGraph?.title || seoTitle,
        description: openGraph?.description || seoDescription,
        images: openGraph?.images || [
          {
            url: "https://llama-runner.example.com/og-image.jpg",
            width: 1200,
            height: 630,
            alt: APP_CONFIG.name,
          },
        ],
        site_name: APP_CONFIG.name,
      }}
      twitter={{
        handle: twitter?.handle || "@llamarunner",
        site: twitter?.site || "@llamarunner",
        cardType: twitter?.cardType || "summary_large_image",
      }}
      additionalMetaTags={[
        {
          name: "keywords",
          content: "Llama, AI, Model Management, Ollama, LMStudio, Machine Learning",
        },
        {
          name: "author",
          content: "Llama Runner Team",
        },
        {
          name: "theme-color",
          content: "#3B82F6",
        },
      ]}
      additionalLinkTags={[
        {
          rel: "icon",
          href: "/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          href: "/apple-touch-icon.png",
          sizes: "180x180",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ]}
    />
  );
}