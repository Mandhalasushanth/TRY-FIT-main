// src/ai/flows/analyze-clothing-image.ts
'use server';

/**
 * @fileOverview Analyzes a clothing image to detect its key features and details.
 *
 * - analyzeClothingImage - A function that handles the clothing image analysis process.
 * - AnalyzeClothingImageInput - The input type for the analyzeClothingImage function.
 * - AnalyzeClothingImageOutput - The return type for the analyzeClothingImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeClothingImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeClothingImageInput = z.infer<typeof AnalyzeClothingImageInputSchema>;

const AnalyzeClothingImageOutputSchema = z.object({
  garmentType: z.string().describe('The type of garment (e.g., dress, shirt, pants).'),
  clothingFeatures: z.array(z.string()).describe('Key features and details of the garment (e.g., color, pattern, neckline).'),
  suggestedGender: z.string().describe('The suggested gender for the model based on the clothing style (male, female, or unisex).'),
});
export type AnalyzeClothingImageOutput = z.infer<typeof AnalyzeClothingImageOutputSchema>;

export async function analyzeClothingImage(input: AnalyzeClothingImageInput): Promise<AnalyzeClothingImageOutput> {
  return analyzeClothingImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeClothingImagePrompt',
  input: {schema: AnalyzeClothingImageInputSchema},
  output: {schema: AnalyzeClothingImageOutputSchema},
  prompt: `You are an AI expert in fashion and image recognition. Your task is to analyze the clothing item in the provided image and identify its key features and details.

  Specifically, extract the following information:
  - Garment Type: Determine the type of garment (e.g., dress, shirt, pants, skirt, blouse, trouser).
  - Clothing Features: Identify and list the key features and details of the garment, such as color, pattern, neckline, sleeve length, embellishments, and overall style.
  - Suggested Gender: Based on the style, cut, and design of the clothing, suggest whether this is typically worn by males, females, or is unisex. Consider factors like:
    * Dresses, skirts, blouses - typically female
    * Men's trousers, suits, ties - typically male  
    * T-shirts, jeans, sweaters - often unisex
    * Consider the cut, fit, and styling details

  Here is the image of the clothing item:
  {{media url=photoDataUri}}

  Respond concisely and accurately.
  `,
});

const analyzeClothingImageFlow = ai.defineFlow(
  {
    name: 'analyzeClothingImageFlow',
    inputSchema: AnalyzeClothingImageInputSchema,
    outputSchema: AnalyzeClothingImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
