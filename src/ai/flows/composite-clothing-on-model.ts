'use server';
/**
 * @fileOverview Composites a clothing image onto an AI-generated model.
 *
 * - compositeClothingOnModel - A function that handles the clothing compositing process.
 * - CompositeClothingOnModelInput - The input type for the compositeClothingOnModel function.
 * - CompositeClothingOnModelOutput - The return type for the compositeClothingOnModel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompositeClothingOnModelInputSchema = z.object({
  clothingImageDataUri: z
    .string()
    .describe(
      "A photo of a clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  modelImageDataUri: z
    .string()
    .describe(
      "A photo of an AI-generated model, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CompositeClothingOnModelInput = z.infer<typeof CompositeClothingOnModelInputSchema>;

const CompositeClothingOnModelOutputSchema = z.object({
  compositeImage: z
    .string()
    .describe('The composite image of the clothing on the model as a data URI.'),
});
export type CompositeClothingOnModelOutput = z.infer<typeof CompositeClothingOnModelOutputSchema>;

export async function compositeClothingOnModel(
  input: CompositeClothingOnModelInput
): Promise<CompositeClothingOnModelOutput> {
  return compositeClothingOnModelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compositeClothingOnModelPrompt',
  input: {schema: CompositeClothingOnModelInputSchema},
  output: {schema: CompositeClothingOnModelOutputSchema},
  prompt: `Composite the clothing item from the first image onto the AI model in the second image. Make sure the clothing looks realistic on the model.

Clothing Image: {{media url=clothingImageDataUri}}
Model Image: {{media url=modelImageDataUri}}`,
});

const compositeClothingOnModelFlow = ai.defineFlow(
  {
    name: 'compositeClothingOnModelFlow',
    inputSchema: CompositeClothingOnModelInputSchema,
    outputSchema: CompositeClothingOnModelOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.clothingImageDataUri}},
        {media: {url: input.modelImageDataUri}},
        {text: 'Composite the clothing item onto the AI model.'},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {compositeImage: media!.url!};
  }
);
