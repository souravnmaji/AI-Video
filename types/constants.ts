import { z } from "zod";

export const COMP_NAME = "MyComp";

export const CompositionProps = z.object({
  title: z.string(),
  scenes: z.array(z.object({
    description: z.string(),
    narration: z.string(),
    duration: z.number(),
  })),
  images: z.array(z.string()),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Generated Video",
  scenes: [],
  images: [],
};

export const DURATION_IN_FRAMES = 1800; // 60 seconds at 30fps
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;
