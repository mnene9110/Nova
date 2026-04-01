
'use server';
/**
 * @fileOverview An AI agent that compares a profile photo with a live verification photo.
 *
 * - verifyFace - A function that handles the face comparison process.
 * - VerifyFaceInput - The input type for the verifyFace function.
 * - VerifyFaceOutput - The return type for the verifyFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyFaceInputSchema = z.object({
  profilePhotoUri: z
    .string()
    .describe(
      "The user's current profile photo as a data URI."
    ),
  livePhotoUri: z
    .string()
    .describe(
      "The live photo taken by the user during verification as a data URI."
    ),
});
export type VerifyFaceInput = z.infer<typeof VerifyFaceInputSchema>;

const VerifyFaceOutputSchema = z.object({
  isMatch: z.boolean().describe('Whether the person in both photos is the same.'),
  confidence: z.number().describe('A score between 0 and 1 indicating match confidence.'),
  reason: z.string().describe('Explanation for the match determination.'),
  actionableFeedback: z.string().optional().describe('Suggestions for the user if verification failed (e.g., "Change your profile photo to a clearer one").'),
});
export type VerifyFaceOutput = z.infer<typeof VerifyFaceOutputSchema>;

export async function verifyFace(input: VerifyFaceInput): Promise<VerifyFaceOutput> {
  return verifyFaceFlow(input);
}

const verifyFacePrompt = ai.definePrompt({
  name: 'verifyFacePrompt',
  input: {schema: VerifyFaceInputSchema},
  output: {schema: VerifyFaceOutputSchema},
  prompt: `You are an expert security analyst specializing in facial recognition and identity verification.

Compare the following two images:
1. Profile Photo: {{media url=profilePhotoUri}}
2. Live Verification Photo: {{media url=livePhotoUri}}

Your task is to determine if both photos represent the same individual. 

Rules:
- If lighting or angles are different but the facial features match, mark as a match.
- If the profile photo is an avatar, object, or significantly different person, mark as not a match.
- Be precise and objective. 
- If they do not match, suggest what the user should do (e.g., "Update your profile photo to a clear, forward-facing photo of yourself").

Generate a JSON response with isMatch, confidence, reason, and actionableFeedback.`,
});

const verifyFaceFlow = ai.defineFlow(
  {
    name: 'verifyFaceFlow',
    inputSchema: VerifyFaceInputSchema,
    outputSchema: VerifyFaceOutputSchema,
  },
  async input => {
    const {output} = await verifyFacePrompt(input);
    return output!;
  }
);
