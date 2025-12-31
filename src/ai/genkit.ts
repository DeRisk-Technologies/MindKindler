import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { DEFAULT_MODEL } from './config';

export const ai = genkit({
  plugins: [googleAI()],
  model: DEFAULT_MODEL, // Centralized model default
});
