import type { ConfigType } from "./types";

export const multimodalSectionGroups = [
  {
    title: "Vision Projection",
    icon: "👁",
    fields: ["mmproj", "mmproj_url", "mmproj_auto", "mmproj_offload"],
  },
  {
    title: "Image Processing",
    icon: "🖼",
    fields: ["image_min_tokens", "image_max_tokens"],
  },
];
