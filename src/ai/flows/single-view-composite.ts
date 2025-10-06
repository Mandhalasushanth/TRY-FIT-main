'use server';

/**
 * @fileOverview Single-angle virtual try-on composite generation.
 *
 * - generateSingleViewComposite - A function that creates one view at a time
 * - SingleViewCompositeInput - The input type for the generateSingleViewComposite function
 * - SingleViewCompositeOutput - The return type for the generateSingleViewComposite function
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SingleViewCompositeInputSchema = z.object({
  clothingImageUri: z.string().describe('The clothing image as a data URI'),
  modelImageUri: z.string().describe('The base model image as a data URI'),
  clothingDescription: z.string().describe('Description of the clothing item'),
  modelDescription: z.string().describe('Description of the model (gender, pose, etc.)'),
  viewAngle: z.enum(['front', 'side', 'back']).describe('The specific view angle to generate'),
});
export type SingleViewCompositeInput = z.infer<typeof SingleViewCompositeInputSchema>;

const SingleViewCompositeOutputSchema = z.object({
  compositeImage: z.string().describe('Composite image as data URI for the specified view'),
});
export type SingleViewCompositeOutput = z.infer<typeof SingleViewCompositeOutputSchema>;

export async function generateSingleViewComposite(input: SingleViewCompositeInput): Promise<SingleViewCompositeOutput> {
  return singleViewCompositeFlow(input);
}

const singleViewPrompt = ai.definePrompt({
  name: 'singleViewCompositePrompt',
  input: {schema: SingleViewCompositeInputSchema},
  output: {schema: SingleViewCompositeOutputSchema},
  prompt: `You are an expert fashion photographer and AI image compositor. Create a realistic composite image showing the model wearing the clothing item from the specified viewing angle.

View Angle: {{{viewAngle}}}

Requirements based on view angle:
- **Front View**: Show the model from the front angle, facing forward
- **Side View**: Show the model from a side profile angle (90 degrees), showing the side silhouette
- **Back View**: Show the model from behind (180 degrees), showing the back of the outfit

General Requirements:
- Ensure the clothing fits naturally on the model from the specified angle
- Maintain realistic lighting and shadows
- Preserve the clothing's original colors and textures
- Create a professional fashion photography look
- Show how the garment drapes and fits from this specific perspective

Model: {{{modelDescription}}}
Clothing: {{{clothingDescription}}}

Base model image: {{media url=modelImageUri}}
Clothing to apply: {{media url=clothingImageUri}}

Generate a high-quality {{{viewAngle}}} view composite as a data URI.`,
});

const singleViewCompositeFlow = ai.defineFlow({
  name: 'singleViewCompositeFlow',
  inputSchema: SingleViewCompositeInputSchema,
  outputSchema: SingleViewCompositeOutputSchema,
}, async (input) => {
  console.log('Starting single view composite generation with viewAngle:', input.viewAngle);
  
  const viewAngleInstructions = {
    front: "Show the model from the front angle, facing forward",
    side: "Show the model from a side profile angle (90 degrees), showing the side silhouette", 
    back: "Show the model from behind (180 degrees), showing the back of the outfit"
  };

  const instruction = viewAngleInstructions[input.viewAngle];
  
  try {
    console.log('Starting AI composite generation with viewAngle:', input.viewAngle);
    
    // Retry logic for API overload
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI composite generation attempt ${attempt}/${maxRetries}`);
        
        const {media} = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: [
            {media: {url: input.clothingImageUri}},
            {media: {url: input.modelImageUri}},
            {text: `Composite the clothing item from the first image onto the AI model in the second image from a ${input.viewAngle} view perspective. ${instruction}.

Requirements:
- Ensure the clothing fits naturally on the model from the specified angle
- Maintain realistic lighting and shadows  
- Preserve the clothing's original colors and textures
- Create a professional fashion photography look
- Show how the garment drapes and fits from this specific perspective

Model: ${input.modelDescription}
Clothing: ${input.clothingDescription}

Generate a high-quality ${input.viewAngle} view composite.`}
          ],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        console.log('AI composite generation completed successfully');
        return {
          compositeImage: media?.url || '',
        };
      } catch (error) {
        console.error(`AI composite generation attempt ${attempt} failed:`, error);
        lastError = error;
        
        // If it's a 503 error and we have retries left, wait and try again
        if (error instanceof Error && error.message.includes('503') && attempt < maxRetries) {
          console.log(`Waiting 3 seconds before retry attempt ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        // If it's not a retryable error or we're out of retries, throw
        throw error;
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error('Error in single view composite generation:', error);
    throw error;
  }
});
