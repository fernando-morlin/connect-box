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
    const executeBtn = document.querySelector('.execute');

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

    // Event listeners for drag and connect
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);

    // Load settings on page load
    initializeSettings();


});