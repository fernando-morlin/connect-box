// js/main.js
import { createElement } from './utils.js';
import { createBlock } from './block-creation.js';
import { startDrag, doDrag, endDrag } from './block-dragging.js';
import { updateConnections, deleteBlock } from './block-connection.js';
import { initializeSettings, saveSettings } from './settings-handler.js';
import { executeWorkflow, executeFromBlock } from './execution.js';

document.addEventListener('DOMContentLoaded', () => {

    const workflowArea = document.getElementById('workflow-area');
    const addTextBtn = document.querySelector('.add-text');
    const addInstructionBtn = document.querySelector('.add-instruction');
    const addImageBtn = document.querySelector('.add-image');
    const executeBtn = document.querySelector('.execute');
    const resultsToggle = document.getElementById('results-toggle');
    const executionResults = document.getElementById('execution-results');

     // --- Event Listeners ---

    addTextBtn.addEventListener('click', () => {
        createBlock('text', 50, 50, workflowArea);
    });

    addInstructionBtn.addEventListener('click', () => {
        createBlock('instruction', 300, 50, workflowArea);
    });

    executeBtn.addEventListener('click', () => {
        executeWorkflow(workflowArea);
    });

    if (resultsToggle && executionResults) {
        resultsToggle.addEventListener('click', () => {
            executionResults.classList.toggle('hidden');
            resultsToggle.textContent = executionResults.classList.contains('hidden') 
                ? 'Show Results' 
                : 'Hide Results';
            
            // Force a DOM reflow to ensure the visibility change takes effect
            void executionResults.offsetHeight;
        });
    }

    // Event listeners for drag and connect
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);

    // Load settings on page load
    initializeSettings();


});