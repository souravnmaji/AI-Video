'use client'
import React, { useState } from 'react';
import { Player } from "@remotion/player";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Main } from '../remotion/MyComp/Main';
import { DURATION_IN_FRAMES, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from '../types/constants';
  
  const apiKey = 'AIzaSyAmUcYgO4KOVusTdWXc7xEHRY-8l7dKMWc';
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  const safetySettings=[
    {
        category:HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category:HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category:HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category:HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }
  ];

  const chatSession = model.startChat({
      generationConfig,
      safetySettings,
    });


const styles = {
  container: {
    maxWidth: '1024px',
    margin: '0 auto',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '20px',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginBottom: '16px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: {
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '4px',
    marginTop: '16px',
  },
  sceneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },
  sceneCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  sceneImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  sceneContent: {
    padding: '16px',
  },
  sceneTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  sceneText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  sceneDuration: {
    fontSize: '14px',
    color: '#999',
  },
  playerContainer: {
    marginTop: '24px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    marginRight: '8px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite',
  },
};

const VideoGenerator = () => {
    const [userPrompt, setUserPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
  
    const extractJsonFromText = (text) => {
      try {
        // First, try parsing the text directly
        return JSON.parse(text);
      } catch (e) {
        // If direct parsing fails, try to extract JSON from markdown
        const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // If no markdown blocks found, try to find the first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          return JSON.parse(text.slice(start, end + 1));
        }
        
        throw new Error('Could not extract valid JSON from response');
      }
    };
  
    const validateVideoContent = (content) => {
      if (!content.title || typeof content.title !== 'string') {
        throw new Error('Invalid content: missing or invalid title');
      }
      if (!Array.isArray(content.scenes) || content.scenes.length === 0) {
        throw new Error('Invalid content: missing or empty scenes array');
      }
      
      content.scenes.forEach((scene, index) => {
        if (!scene.description || !scene.narration || !scene.duration) {
          throw new Error(`Invalid scene at index ${index}: missing required properties`);
        }
        if (typeof scene.duration !== 'number' || scene.duration <= 0) {
          throw new Error(`Invalid scene at index ${index}: invalid duration`);
        }
      });
      
      return content;
    };
  
    const generateVideoContent = async (prompt) => {
      try {
        setLoading(true);
        setError('');
  
        // Generate script content using Gemini AI
        const result = await chatSession.sendMessage(
          `Create a video script about: ${prompt}. 
           Break it down into 3-4 scenes with clear visual descriptions for each scene.
           Provide the response in strict JSON format with this structure:
           {
             "title": "Video Title",
             "scenes": [
               {
                 "description": "Visual description for scene",
                 "narration": "Narration text",
                 "duration": 5
               }
             ]
           }
           Do not include any markdown formatting or additional text outside the JSON.`
        );
        
        const response = await result.response;
        const text = response.text();
        
        // Parse and validate the JSON content
        const rawContent = extractJsonFromText(text);
        const validatedContent = validateVideoContent(rawContent);
        setGeneratedContent(validatedContent);
  
        // Generate images for each scene with error handling
        const imagePromises = validatedContent.scenes.map(async (scene, index) => {
          try {
            return await generateImageForPage([scene.description]);
          } catch (err) {
            console.error(`Failed to generate image for scene ${index + 1}:`, err);
            return null; // Return null for failed images
          }
        });
  
        const generatedImages = await Promise.all(imagePromises);
        setImages(generatedImages.filter(Boolean)); // Filter out null values
  
      } catch (err) {
        console.error('Error generating video content:', err);
        setError('Failed to generate video content: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
  
    const generateImageForPage = async (pageContent) => {
      try {
        const response = await fetch('https://api.getimg.ai/v1/flux-schnell/text-to-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer key-3PuIx4IirgkCkFgCDo3owDeW6v0wdW1nTKfQB4cmx76Fh2NILNiaOAuL6rbIe5TsPK8mx8jsCZV2xlajSFs82nftF5rhpXNV`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: pageContent.join(' '),
            width: 1200,
            height: 1200,
            steps: 2,
            output_format: 'png',
            response_format: 'url',
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Image generation failed with status ${response.status}`);
        }
  
        const data = await response.json();
        return data.url;
      } catch (error) {
        throw new Error(`Image generation failed: ${error.message}`);
      }
    };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>AI Video Generator</h1>
        </div>

        <textarea
          placeholder="Describe the video you want to create..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          style={styles.textarea}
        />
        
        <button 
          onClick={() => generateVideoContent(userPrompt)}
          disabled={loading || !userPrompt}
          style={{
            ...styles.button,
            ...(loading || !userPrompt ? styles.buttonDisabled : {})
          }}
        >
          {loading ? (
            <>
              <div style={styles.loadingSpinner} />
              Generating Video...
            </>
          ) : (
            'Generate Video'
          )}
        </button>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {generatedContent && (
          <div>
            <h2 style={styles.title}>{generatedContent.title}</h2>
            
            <div style={styles.sceneGrid}>
              {generatedContent.scenes.map((scene, index) => (
                <div key={index} style={styles.sceneCard}>
                  {images[index] && (
                    <img 
                      src={images[index]} 
                      alt={`Scene ${index + 1}`}
                      style={styles.sceneImage}
                    />
                  )}
                  <div style={styles.sceneContent}>
                    <h3 style={styles.sceneTitle}>Scene {index + 1}</h3>
                    <p style={styles.sceneText}>{scene.narration}</p>
                    <p style={styles.sceneDuration}>
                      Duration: {scene.duration}s
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.playerContainer}>
              <Player
                component={Main}
                inputProps={{
                  title: generatedContent.title,
                  scenes: generatedContent.scenes,
                  images: images
                }}
                durationInFrames={DURATION_IN_FRAMES}
                fps={VIDEO_FPS}
                compositionHeight={VIDEO_HEIGHT}
                compositionWidth={VIDEO_WIDTH}
                style={{ width: '100%', aspectRatio: '16/9' }}
                controls
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;