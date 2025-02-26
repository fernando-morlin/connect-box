// js/block-creation.js
import { createElement } from './utils.js';
import { startDrag } from './block-dragging.js';
import { updateConnections, deleteBlock } from './block-connection.js';
import { executeFromBlock } from './execution.js';

let blockCount = 0;

function createBlock(type, x, y, workflowArea) {
    try {
        if (!['text', 'instruction', 'image'].includes(type)) {
            throw new Error('Invalid block type');
        }

        blockCount++;
        const block = createElement('div', `block ${type}-block`);
        block.id = `${type}-${blockCount}`;

        // Position block
        const maxX = workflowArea.clientWidth - 200;
        const maxY = workflowArea.clientHeight - 100;
        block.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
        block.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
        
        // Increase default width for instruction blocks
        if (type === 'instruction') {
            block.style.width = '250px'; // Increased from default
        }

        const label = createElement('div', 'block-label');
        label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        block.appendChild(label);

        // Create block content based on type
        if (type === 'image') {
            // Image block code remains unchanged
            const imageInput = createElement('input', '', { 
                type: 'file', 
                accept: 'image/*',
                id: `file-${blockCount}`
            });
            const imageLabel = createElement('label', '', {
                for: `file-${blockCount}`
            });
            imageLabel.textContent = 'Browse';
            const imagePreview = createElement('img', 'image-preview');
            imagePreview.style.display = 'none';
            imagePreview.style.maxWidth = '100%';
            
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        imagePreview.src = event.target.result;
                        imagePreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });

            block.appendChild(imageInput);
            block.appendChild(imageLabel);
            block.appendChild(imagePreview);
        } else {
            const textarea = createElement('textarea', '', { 
                placeholder: type === 'text' ? 'Enter text...' : 'Enter instructions...' 
            });
            block.appendChild(textarea);
        }

        // Add handles
        const leftHandle = createElement('div', 'handle left');
        const rightHandle = createElement('div', 'handle right');
        block.appendChild(leftHandle);
        block.appendChild(rightHandle);

        // Add delete button
        const deleteButton = createElement('button', 'delete-button');
        deleteButton.textContent = 'x';
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteBlock(block.id, workflowArea);
        });
        block.appendChild(deleteButton);

        // Add resize handle
        const resizeHandle = createElement('div', 'resize-handle');
        block.appendChild(resizeHandle);

        // Add play button for instruction blocks
        if (type === 'instruction') {
            const playButton = createElement('button', 'play-button');
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            playButton.addEventListener('click', (event) => {
                event.stopPropagation();
                executeFromBlock(block.id);
            });
            block.appendChild(playButton);
            
            // Add the gear button for instruction blocks
            const gearButton = createElement('button', 'gear-button');
            gearButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
            
            // Add a click event for debugging
            gearButton.addEventListener('click', (event) => {
                event.stopPropagation();
                
                // Show block-specific settings modal
                showBlockSettings(block.id);
            });
            
            block.appendChild(gearButton);
        }

        const connectionStatus = createElement('div', 'connection-status');
        block.appendChild(connectionStatus);

        label.addEventListener('mousedown', startDrag);
        block.addEventListener('mousedown', startDrag);
        resizeHandle.addEventListener('mousedown', startResize);

        workflowArea.appendChild(block);
        return block;
    } catch (error) {
        console.error('Error creating block:', error);
        return null;
    }
}

// Add resize functionality
function startResize(event) {
    event.stopPropagation(); // Prevent block dragging
    
    const block = event.target.closest('.block');
    const initialWidth = block.offsetWidth;
    const initialHeight = block.offsetHeight;
    const initialX = event.clientX;
    const initialY = event.clientY;
    
    function doResize(moveEvent) {
        const deltaX = moveEvent.clientX - initialX;
        const deltaY = moveEvent.clientY - initialY;
        
        // Set minimum width and height
        const newWidth = Math.max(150, initialWidth + deltaX);
        const newHeight = Math.max(100, initialHeight + deltaY);
        
        block.style.width = `${newWidth}px`;
        block.style.height = `${newHeight}px`;
        
        // Update connections as the block size changes
        const workflowArea = document.getElementById('workflow-area');
        updateConnections(workflowArea);
    }
    
    function endResize() {
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', endResize);
    }
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', endResize);
}

function showBlockSettings(blockId) {
    // Get or create block-specific settings modal
    let blockSettingsModal = document.getElementById(`settings-modal-${blockId}`);
    
    if (!blockSettingsModal) {
        // Clone the main settings modal and customize for this block
        const mainModal = document.getElementById('settings-modal');
        blockSettingsModal = mainModal.cloneNode(true);
        blockSettingsModal.id = `settings-modal-${blockId}`;
        
        // Remove the API key settings since those are global
        const apiKeyInputs = blockSettingsModal.querySelectorAll('#api-key, #openrouter-api-key');
        apiKeyInputs.forEach(input => {
            const parentGroup = input.closest('.form-group');
            if (parentGroup) {
                parentGroup.remove();
            }
        });
        
        // Change the title to indicate block-specific settings
        const title = blockSettingsModal.querySelector('h2');
        if (title) {
            title.textContent = `Block Settings (${blockId})`;
        }
        
        // Change the save button ID and behavior
        const saveButton = blockSettingsModal.querySelector('#save-settings');
        if (saveButton) {
            saveButton.id = `save-settings-${blockId}`;
            saveButton.textContent = 'Save Block Settings';
            saveButton.addEventListener('click', () => {
                saveBlockSettings(blockId, blockSettingsModal);
            });
        }
        
        // Load current block settings
        loadBlockSettings(blockId, blockSettingsModal);
        
        // Add modal to body
        document.body.appendChild(blockSettingsModal);
    }
    
    // Show the modal
    blockSettingsModal.style.display = 'block';
    
    // Add closing behavior for the modal
    window.addEventListener('click', function closeBlockModal(event) {
        if (event.target === blockSettingsModal) {
            blockSettingsModal.style.display = 'none';
            window.removeEventListener('click', closeBlockModal);
        }
    });
}

function loadBlockSettings(blockId, modal) {
    // Get the block's current settings from localStorage or use defaults
    const apiProvider = localStorage.getItem(`block-${blockId}-api-provider`) || localStorage.getItem('api-provider') || 'gemini';
    const modelSelect = apiProvider === 'gemini' 
        ? (localStorage.getItem(`block-${blockId}-gemini-model`) || localStorage.getItem('gemini-model') || 'gemini-2.0-pro-exp-02-05')
        : (localStorage.getItem(`block-${blockId}-openrouter-model`) || localStorage.getItem('openrouter-model') || 'deepseek/deepseek-chat:free');
    
    // Set the current values in the modal
    const providerSelect = modal.querySelector('#api-provider');
    if (providerSelect) {
        providerSelect.value = apiProvider;
    }
    
    // Show/hide appropriate settings sections based on provider
    const geminiSettings = modal.querySelector('#gemini-settings');
    const openrouterSettings = modal.querySelector('#openrouter-settings');
    
    if (apiProvider === 'gemini' && geminiSettings && openrouterSettings) {
        geminiSettings.style.display = 'block';
        openrouterSettings.style.display = 'none';
        
        const geminiModelSelect = modal.querySelector('#model-select');
        if (geminiModelSelect) {
            geminiModelSelect.value = modelSelect;
        }
    } else if (geminiSettings && openrouterSettings) {
        geminiSettings.style.display = 'none';
        openrouterSettings.style.display = 'block';
        
        const openrouterModelSelect = modal.querySelector('#openrouter-model-select');
        if (openrouterModelSelect) {
            openrouterModelSelect.value = modelSelect;
        }
    }
    
    // Set up change handler for API provider selection
    const apiProviderSelect = modal.querySelector('#api-provider');
    if (apiProviderSelect) {
        apiProviderSelect.addEventListener('change', () => {
            if (apiProviderSelect.value === 'gemini' && geminiSettings && openrouterSettings) {
                geminiSettings.style.display = 'block';
                openrouterSettings.style.display = 'none';
            } else if (geminiSettings && openrouterSettings) {
                geminiSettings.style.display = 'none';
                openrouterSettings.style.display = 'block';
            }
        });
    }
}

function saveBlockSettings(blockId, modal) {
    // Get values from the modal
    const apiProviderSelect = modal.querySelector('#api-provider');
    const geminiModelSelect = modal.querySelector('#model-select');
    const openrouterModelSelect = modal.querySelector('#openrouter-model-select');
    
    if (apiProviderSelect) {
        const apiProvider = apiProviderSelect.value;
        localStorage.setItem(`block-${blockId}-api-provider`, apiProvider);
        
        if (apiProvider === 'gemini' && geminiModelSelect) {
            localStorage.setItem(`block-${blockId}-gemini-model`, geminiModelSelect.value);
        } else if (openrouterModelSelect) {
            localStorage.setItem(`block-${blockId}-openrouter-model`, openrouterModelSelect.value);
        }
    }
    
    // Hide modal after saving
    modal.style.display = 'none';
}

export { createBlock };