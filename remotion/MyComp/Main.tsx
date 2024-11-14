import { z } from "zod";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion";

// Update CompositionProps to include scenes and images
const CompositionProps = z.object({
  title: z.string(),
  scenes: z.array(z.object({
    description: z.string(),
    narration: z.string(),
    duration: z.number(),
  })),
  images: z.array(z.string()),
});

const styles = {
  container: {
    backgroundColor: "white",
  },
  title: {
    fontFamily: "Inter, sans-serif",
    fontSize: 70,
    textAlign: "center",
    position: "absolute",
    top: "50%",
    width: "100%",
    transform: "translateY(-50%)",
  },
  scene: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  sceneImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  narration: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 32,
    color: "white",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
    padding: "0 40px",
    backgroundColor: "rgba(0,0,0,0.5)",
    margin: 0,
  },
};

export const Main = ({ title, scenes, images }: z.infer<typeof CompositionProps>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleDuration = 60; // 2 seconds at 30fps
  let currentFrame = 0;

  return (
    <AbsoluteFill style={styles.container}>
      <Sequence durationInFrames={titleDuration}>
        <h1 style={styles.title}>{title}</h1>
      </Sequence>

      {scenes.map((scene, index) => {
        const startFrame = titleDuration + currentFrame;
        const duration = Math.floor(scene.duration * fps);
        currentFrame += duration;

        return (
          <Sequence from={startFrame} durationInFrames={duration} key={index}>
            <AbsoluteFill style={styles.scene}>
              <Img src={images[index]} style={styles.sceneImage} />
              <p style={styles.narration}>{scene.narration}</p>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};