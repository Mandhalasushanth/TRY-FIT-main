'use server';

/**
 * @fileOverview An AI model generation agent.
 *
 * - generateAiModel - A function that handles the AI model generation process.
 * - GenerateAiModelInput - The input type for the generateAiModel function.
 * - GenerateAiModelOutput - The return type for the generateAiModel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiModelInputSchema = z.object({
  description: z.string().describe('The description of the AI model to generate, including attributes like size, pose, and skin tone.'),
});
export type GenerateAiModelInput = z.infer<typeof GenerateAiModelInputSchema>;

const GenerateAiModelOutputSchema = z.object({
  modelImage: z
    .string()
    .describe(
      "A photo of the generated AI model, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateAiModelOutput = z.infer<typeof GenerateAiModelOutputSchema>;

export async function generateAiModel(input: GenerateAiModelInput): Promise<GenerateAiModelOutput> {
  return generateAiModelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiModelPrompt',
  input: {schema: GenerateAiModelInputSchema},
  output: {schema: GenerateAiModelOutputSchema},
  prompt: `You are an AI model generator. Generate an image of an AI model based on the following description: {{{description}}}. The image should be a data URI.`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateAiModelFlow = ai.defineFlow(
  {
    name: 'generateAiModelFlow',
    inputSchema: GenerateAiModelInputSchema,
    outputSchema: GenerateAiModelOutputSchema,
  },
  async input => {
    console.log('Starting AI model generation with description:', input.description);
    
    // Retry logic for API overload
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI model generation attempt ${attempt}/${maxRetries}`);
        
        const {media} = await ai.generate({
          prompt: input.description,
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        
        console.log('AI model generation completed successfully');
        return {
          modelImage: media!.url,
        };
      } catch (error) {
        console.error(`AI model generation attempt ${attempt} failed:`, error);
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
  }
);
