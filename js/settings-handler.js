// js/settings-handler.js

// Initialize settings with defaults or from localStorage
let apiProvider = localStorage.getItem('api-provider') || 'gemini';
let apiKey = localStorage.getItem('gemini-api-key') || '';
let selectedModel = localStorage.getItem('gemini-model') || 'gemini-2.0-pro-exp-02-05';
let openrouterApiKey = localStorage.getItem('openrouter-api-key') || '';
let openrouterModel = localStorage.getItem('openrouter-model') || 'deepseek/deepseek-chat:free';

const settingsBtn = document.querySelector('.settings');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const apiProviderSelect = document.getElementById('api-provider');
const geminiSettings = document.getElementById('gemini-settings');
const openrouterSettings = document.getElementById('openrouter-settings');

function initializeSettings() {

    // Set API provider
    apiProviderSelect.value = apiProvider;

    // Show/hide sections based on provider
    if (apiProvider === 'gemini') {
        geminiSettings.style.display = 'block';
        openrouterSettings.style.display = 'none';
    } else {
        geminiSettings.style.display = 'none';
        openrouterSettings.style.display = 'block';
    }

    // Load Gemini settings
    if (apiKey) {
        document.getElementById('api-key').value = apiKey;
    }

    if (selectedModel) {
        document.getElementById('model-select').value = selectedModel;
    }

    // Load OpenRouter settings
    if (openrouterApiKey) {
        document.getElementById('openrouter-api-key').value = openrouterApiKey;
    }

    if (openrouterModel) {
        document.getElementById('openrouter-model-select').value = openrouterModel;
    }

    // Event Listeners for settings modal.
    // Show/hide provider-specific settings based on selection
    apiProviderSelect.addEventListener('change', () => {
        if (apiProviderSelect.value === 'gemini') {
            geminiSettings.style.display = 'block';
            openrouterSettings.style.display = 'none';
        } else {
            geminiSettings.style.display = 'none';
            openrouterSettings.style.display = 'block';
        }
    });

    settingsBtn.addEventListener('click', () => {
        // Ensure form shows current values
        apiProviderSelect.value = apiProvider;

        if (apiProvider === 'gemini') {
            geminiSettings.style.display = 'block';
            openrouterSettings.style.display = 'none';
        } else {
            geminiSettings.style.display = 'none';
            openrouterSettings.style.display = 'block';
        }

        document.getElementById('api-key').value = apiKey;
        document.getElementById('model-select').value = selectedModel;
        document.getElementById('openrouter-api-key').value = openrouterApiKey;
        document.getElementById('openrouter-model-select').value = openrouterModel;

        settingsModal.style.display = 'block';
    });

    saveSettingsBtn.addEventListener('click', saveSettings);

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
}

function saveSettings() {
    apiProvider = apiProviderSelect.value;
    apiKey = document.getElementById('api-key').value;
    selectedModel = document.getElementById('model-select').value;
    openrouterApiKey = document.getElementById('openrouter-api-key').value;
    openrouterModel = document.getElementById('openrouter-model-select').value;

    // Save to localStorage
    localStorage.setItem('api-provider', apiProvider);
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('gemini-model', selectedModel);
    localStorage.setItem('openrouter-api-key', openrouterApiKey);
    localStorage.setItem('openrouter-model', openrouterModel);
    
    // Clear out all block-specific settings
    // First get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter for block-specific settings
    const blockSettingsKeys = keys.filter(key => 
        key.startsWith('block-') && 
        (key.endsWith('-api-provider') || 
         key.endsWith('-gemini-model') || 
         key.endsWith('-openrouter-model'))
    );

    settingsModal.style.display = 'none';
}

function getSettings() {
    return {
        apiProvider,
        apiKey,
        selectedModel,
        openrouterApiKey,
        openrouterModel
    }
}

export { initializeSettings, saveSettings, getSettings };