// js/main.js
import { createElement } from './utils.js';
import { createBlock } from './block-creation.js';
import { startDrag, doDrag, endDrag } from './block-dragging.js';
import { updateConnections, deleteBlock } from './block-connection.js';
import { initializeSettings } from './settings-handler.js';
import { executeWorkflow, executeFromBlock } from './execution.js';
import { initializeZoom, loadSavedZoom } from './zoom-handler.js'; // Import zoom functionality

document.addEventListener('DOMContentLoaded', () => {

    const workflowArea = document.getElementById('workflow-area');
    const resultsToggle = document.getElementById('results-toggle');
    const executionResults = document.getElementById('execution-results');
    
    // Temporarily remove the results toggle button
    workflowArea.removeChild(resultsToggle);
    
    // Create a content wrapper for zoom functionality
    const workflowContent = createElement('div', 'workflow-content');
    
    // Move existing workflow area children to the content wrapper
    while (workflowArea.firstChild) {
        workflowContent.appendChild(workflowArea.firstChild);
    }
    
    // Add the content wrapper to the workflow area
    workflowArea.appendChild(workflowContent);
    
    // Add the results toggle back to workflow area but outside of the content wrapper
    workflowArea.appendChild(resultsToggle);
    
    // Important: Move execution results and toggle outside of the workflow content
    // to prevent them from being affected by zoom
    if (resultsToggle && executionResults) {
        // Remove from current location
        if (resultsToggle.parentNode) {
            resultsToggle.parentNode.removeChild(resultsToggle);
        }
        if (executionResults.parentNode) {
            executionResults.parentNode.removeChild(executionResults);
        }
        
        // Add to body instead of workflow area
        document.body.appendChild(resultsToggle);
        document.body.appendChild(executionResults);
    }
    
    const addTextBtn = document.querySelector('.add-text');
    const addInstructionBtn = document.querySelector('.add-instruction');
    const addImageBtn = document.querySelector('.add-image');
    const executeBtn = document.querySelector('.execute');

    // --- Event Listeners ---

    addTextBtn.addEventListener('click', () => {
        createBlock('text', 50, 50, workflowContent); // Change to workflowContent
    });

    addInstructionBtn.addEventListener('click', () => {
        createBlock('instruction', 300, 50, workflowContent); // Change to workflowContent
    });

    addImageBtn.addEventListener('click', () => {
        createBlock('image', 150, 50, workflowContent); // Change to workflowContent
    });

    executeBtn.addEventListener('click', () => {
        executeWorkflow(workflowArea); // Corrected function call
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
    
    // Initialize zoom controls
    initializeZoom(workflowArea);
    
    // Load saved zoom level
    loadSavedZoom(workflowArea);
});