'use server';

/**
 * @fileOverview Multi-angle virtual try-on composite generation.
 *
 * - generateMultiAngleComposite - A function that creates front, side, and back views
 * - MultiAngleCompositeInput - The input type for the generateMultiAngleComposite function
 * - MultiAngleCompositeOutput - The return type for the generateMultiAngleComposite function
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultiAngleCompositeInputSchema = z.object({
  clothingImageUri: z.string().describe('The clothing image as a data URI'),
  modelImageUri: z.string().describe('The base model image as a data URI'),
  clothingDescription: z.string().describe('Description of the clothing item'),
  modelDescription: z.string().describe('Description of the model (gender, pose, etc.)'),
});
export type MultiAngleCompositeInput = z.infer<typeof MultiAngleCompositeInputSchema>;

const MultiAngleCompositeOutputSchema = z.object({
  frontView: z.string().describe('Front view composite image as data URI'),
  sideView: z.string().describe('Side view composite image as data URI'),
  backView: z.string().describe('Back view composite image as data URI'),
});
export type MultiAngleCompositeOutput = z.infer<typeof MultiAngleCompositeOutputSchema>;

export async function generateMultiAngleComposite(input: MultiAngleCompositeInput): Promise<MultiAngleCompositeOutput> {
  return multiAngleCompositeFlow(input);
}

const frontViewPrompt = ai.definePrompt({
  name: 'frontViewCompositePrompt',
  input: {schema: MultiAngleCompositeInputSchema},
  output: {schema: z.object({ frontView: z.string() })},
  prompt: `You are an expert fashion photographer and AI image compositor. Create a realistic front view composite image showing the model wearing the clothing item.

Requirements:
- Show the model from the front angle
- Ensure the clothing fits naturally on the model
- Maintain realistic lighting and shadows
- Preserve the clothing's original colors and textures
- Create a professional fashion photography look

Model: {{{modelDescription}}}
Clothing: {{{clothingDescription}}}

Base model image: {{media url=modelImageUri}}
Clothing to apply: {{media url=clothingImageUri}}

Generate a high-quality front view composite as a data URI.`,
});

const sideViewPrompt = ai.definePrompt({
  name: 'sideViewCompositePrompt',
  input: {schema: MultiAngleCompositeInputSchema},
  output: {schema: z.object({ sideView: z.string() })},
  prompt: `You are an expert fashion photographer and AI image compositor. Create a realistic side view composite image showing the model wearing the clothing item.

Requirements:
- Show the model from a side profile angle (90 degrees)
- Ensure the clothing fits naturally from the side perspective
- Show how the garment drapes and fits from the side
- Maintain realistic lighting and shadows
- Preserve the clothing's original colors and textures

Model: {{{modelDescription}}}
Clothing: {{{clothingDescription}}}

Base model image: {{media url=modelImageUri}}
Clothing to apply: {{media url=clothingImageUri}}

Generate a high-quality side view composite as a data URI.`,
});

const backViewPrompt = ai.definePrompt({
  name: 'backViewCompositePrompt',
  input: {schema: MultiAngleCompositeInputSchema},
  output: {schema: z.object({ backView: z.string() })},
  prompt: `You are an expert fashion photographer and AI image compositor. Create a realistic back view composite image showing the model wearing the clothing item.

Requirements:
- Show the model from behind (180 degrees)
- Ensure the clothing fits naturally from the back perspective
- Show how the garment looks from behind
- Maintain realistic lighting and shadows
- Preserve the clothing's original colors and textures

Model: {{{modelDescription}}}
Clothing: {{{clothingDescription}}}

Base model image: {{media url=modelImageUri}}
Clothing to apply: {{media url=clothingImageUri}}

Generate a high-quality back view composite as a data URI.`,
});

const multiAngleCompositeFlow = ai.defineFlow({
  name: 'multiAngleCompositeFlow',
  inputSchema: MultiAngleCompositeInputSchema,
  outputSchema: MultiAngleCompositeOutputSchema,
}, async (input) => {
  // Generate all three views in parallel for better performance
  const [frontResult, sideResult, backResult] = await Promise.all([
    frontViewPrompt(input),
    sideViewPrompt(input),
    backViewPrompt(input),
  ]);

  return {
    frontView: frontResult.output?.frontView || '',
    sideView: sideResult.output?.sideView || '',
    backView: backResult.output?.backView || '',
  };
});
