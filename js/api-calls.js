// js/api-calls.js
import { getSettings } from './settings-handler.js';

// Function to call Gemini API
async function callGeminiAPI(prompt) {
    const { apiKey, selectedModel } = getSettings();
    if (!apiKey) {
        throw new Error('API key not configured. Please set it in settings.');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Function to call OpenRouter API
async function callOpenRouterAPI(prompt) {
     const { openrouterApiKey, openrouterModel } = getSettings();
    if (!openrouterApiKey) {
        throw new Error('OpenRouter API key not configured. Please set it in settings.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterApiKey}`,
            'HTTP-Referer': window.location.origin // Required by OpenRouter
        },
        body: JSON.stringify({
            model: openrouterModel,
            messages: [
                { role: "user", content: prompt }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Unified function to execute instruction (using either Gemini or OpenRouter)
async function executeInstruction(content, input) {
    const { apiProvider } = getSettings();
    try {
        // If there's input, combine it with the instruction
        const prompt = input ? `${content}\nInput: ${input}` : content;

        // Use the appropriate API based on user selection
        if (apiProvider === 'gemini') {
            const result = await callGeminiAPI(prompt);
            return result;
        } else {
            const result = await callOpenRouterAPI(prompt);
            return result;
        }
    } catch (error) {
        throw new Error(`LLM execution failed: ${error.message}`);
    }
}

export { executeInstruction };