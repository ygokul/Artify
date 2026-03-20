
'use server';

import { generateImageFromPrompt } from '@/ai/flows/generate-image-from-prompt';

export async function generateImageAction(prevState: any, formData: FormData) {
    const prompt = formData.get('prompt') as string;

    if (!prompt) {
        return {
            image: null,
            error: 'Prompt is required.',
        };
    }

    try {
        const { image } = await generateImageFromPrompt({ prompt });
        return {
            image,
            error: null,
        };
    } catch (error: any) {
        console.error(error);
        return {
            image: null,
            error: error.message || 'An unexpected error occurred.',
        };
    }
}
