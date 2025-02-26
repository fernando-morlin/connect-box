// js/api-calls.js
import { getSettings } from './settings-handler.js';

// Function to call Gemini API
async function callGeminiAPI(prompt, imageData = null) {
    const { apiKey, selectedModel } = getSettings();
    if (!apiKey) {
        throw new Error('API key not configured. Please set it in settings.');
    }

    // Build the request body
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    // Add image to the request if provided
    if (imageData) {
        requestBody.contents[0].parts.unshift({
            inline_data: {
                mime_type: "image/jpeg",
                data: imageData.split(',')[1] // Remove the data:image/jpeg;base64, prefix
            }
        });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Function to call OpenRouter API
async function callOpenRouterAPI(prompt, imageData = null) {
    const { openrouterApiKey, openrouterModel } = getSettings();
    if (!openrouterApiKey) {
        throw new Error('OpenRouter API key not configured. Please set it in settings.');
    }

    // List of vision-capable models in OpenRouter
    const visionModels = [
        "google/gemini-2.0-flash-lite-preview-02-05",
        "google/gemini-2.0-flash-exp",
        "google/gemini-2.0-pro-exp-02-05",
        "google/gemini-2.0-flash-thinking-exp-1219",
        "google/gemini-2.0-flash-thinking-exp",
        "google/gemini-exp-1206",
        "meta-llama/llama-3.2-11b-vision-instruct",
        "qwen/qwen2.5-vl-72b-instruct",
        "qwen/qwen-vl-plus"
    ];

    // Create the message content
    let messages = [];
    
    // If we have image data and the selected model supports vision
    if (imageData && visionModels.some(model => openrouterModel.includes(model))) {
        // Extract the base64 data without the prefix for OpenRouter
        const base64Image = imageData.split(',')[1]; // Remove the data:image/jpeg;base64, prefix
        
        messages = [
            { 
                role: "user", 
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            }
        ];
    } else {
        messages = [
            { role: "user", content: prompt }
        ];
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
            messages: messages
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", errorText);
        throw new Error(`OpenRouter API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Unified function to execute instruction (using either Gemini or OpenRouter)
async function executeInstruction(content, input, imageData = null) {
    const { apiProvider } = getSettings();
    try {
        // If there's input, combine it with the instruction
        const prompt = input ? `${content}\nInput: ${input}` : content;

        // Use the appropriate API based on user selection
        if (apiProvider === 'gemini') {
            const result = await callGeminiAPI(prompt, imageData);
            return result;
        } else {
            // OpenRouter now supports images for compatible models
            const result = await callOpenRouterAPI(prompt, imageData);
            return result;
        }
    } catch (error) {
        throw new Error(`LLM execution failed: ${error.message}`);
    }
}

export { executeInstruction };