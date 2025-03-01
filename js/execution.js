// js/execution.js

import { executeInstruction } from './api-calls.js';

// Add execution state tracking
let executionInProgress = false;

// Update executeWorkflow function to handle image blocks and show execution status
async function executeWorkflow(workflowArea) {
    // Prevent multiple executions running simultaneously
    if (executionInProgress) return;
    executionInProgress = true;

    const executionResultsDiv = document.getElementById('execution-results');
    executionResultsDiv.innerHTML = '<div class="execution-status">Execution in progress... <div class="spinner"></div></div>'; // Add loading indicator
    executionResultsDiv.classList.add('visible');
    
    // Add visual indication on the execute button
    const executeBtn = document.querySelector('.execute');
    executeBtn.classList.add('executing');

    try {
        // Track which blocks have been processed
        const processedBlocks = new Set();
        
        // Store input data and images for blocks
        const blockInputs = new Map();
        const blockImages = new Map();
        
        // Count incoming connections for each block
        const incomingConnectionCount = new Map();
        window.connections.forEach(conn => {
            const target = conn.target;
            incomingConnectionCount.set(target, (incomingConnectionCount.get(target) || 0) + 1);
        });
        
        // Find start blocks (no incoming connections)
        const startBlocks = window.connections.filter(el => !window.connections.some(innEl => innEl.target === el.source)).map(el => el.source);

        // Add blocks that have no connections at all
        const allBlocks = Array.from(document.querySelectorAll('.block')).map(block => block.id);
        allBlocks.forEach(blockId => {
            if (!window.connections.some(conn => conn.source === blockId || conn.target === blockId)) {
                startBlocks.push(blockId);
            }
        });

        if (startBlocks.length === 0 && window.connections.length > 0) {
            executionResultsDiv.innerHTML = "<p>Error: The workflow has a cycle or is not properly connected.</p>";
            return;
        }

        // Track how many inputs have been processed for each block
        const processedInputsCount = new Map();
        
        // Process the workflow in a breadth-first manner
        let blocksToProcess = [...startBlocks];
        
        while (blocksToProcess.length > 0) {
            const currentBlockId = blocksToProcess.shift();
            
            // Skip if already processed
            if (processedBlocks.has(currentBlockId)) continue;
            
            const block = document.getElementById(currentBlockId);
            if (!block) {
                executionResultsDiv.innerHTML += `<p>Error: Block with ID ${currentBlockId} not found.</p>`;
                continue;
            }
            
            // Add visual indication to the current block
            block.classList.add('executing');
            
            const incomingCount = incomingConnectionCount.get(currentBlockId) || 0;
            const processedCount = processedInputsCount.get(currentBlockId) || 0;
            
            // If this block has incoming connections and we haven't processed all inputs yet
            if (incomingCount > 0 && processedCount < incomingCount) {
                // Skip for now, will process later when all inputs are ready
                block.classList.remove('executing');
                continue;
            }
            
            // Determine block type
            const isTextBlock = block.classList.contains('text-block');
            const isInstructionBlock = block.classList.contains('instruction-block');
            const isImageBlock = block.classList.contains('image-block');
            
            let type = isTextBlock ? 'Text' : (isInstructionBlock ? 'Instruction' : 'Image');
            
            // Get content based on block type
            let content = '';
            let imageData = null;
            
            if (isTextBlock || isInstructionBlock) {
                content = block.querySelector('textarea').value;
            } else if (isImageBlock) {
                const imagePreview = block.querySelector('.image-preview');
                if (imagePreview && imagePreview.src) {
                    imageData = imagePreview.src;
                }
            }
            
            // Get all inputs for this block and combine them
            let input = '';
            if (blockInputs.has(currentBlockId)) {
                // If multiple inputs, join them with newlines
                if (Array.isArray(blockInputs.get(currentBlockId))) {
                    input = blockInputs.get(currentBlockId).join('\n\n');
                } else {
                    input = blockInputs.get(currentBlockId);
                }
            }
            
            // Also get any image inputs for this block
            if (blockImages.has(currentBlockId)) {
                imageData = blockImages.get(currentBlockId);
            }
            
            let output = '';
            
            if (type === "Text") {
                if ((input && content.trim() === '')) {
                    block.querySelector('textarea').value = input;
                    output = input;
                } else {
                    output = content;
                }
                // Update live status in results area
                updateExecutionStatus(`Processing ${type} block (${block.id})...`);
                
                executionResultsDiv.innerHTML += `<p><span class="result-label">Text (${block.id}):</span> ${output}</p>`;
            } else if (type === "Image") {
                output = imageData;
                // Update live status in results area
                updateExecutionStatus(`Processing ${type} block (${block.id})...`);
                
                executionResultsDiv.innerHTML += `<p><span class="result-label">Image (${block.id}):</span> [Image data available for processing]</p>`;
            } else {
                try {
                    // Update live status in results area for API call
                    updateExecutionStatus(`Executing instruction in block ${block.id}...`);
                    
                    const result = await executeInstruction(content, input, imageData, currentBlockId);
                    output = result;
                    
                    // Find outgoing text blocks and update their content
                    const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
                    const hasTextBlockTarget = outgoingConnections.some(conn => {
                        const targetBlock = document.getElementById(conn.target);
                        return targetBlock && targetBlock.classList.contains('text-block');
                    });
                    
                    // Only show the result in execution area if not sending to a text block
                    if (!hasTextBlockTarget) {
                        executionResultsDiv.innerHTML += `<p><span class="result-label">Instruction (${block.id}):</span> Instruction: ${content}<br><br>Result: ${result}</p>`;
                    } else {
                        // Just show that the instruction was executed without showing the result at all
                        executionResultsDiv.innerHTML += `<p><span class="result-label">Instruction (${block.id}):</span> Instruction: ${content}<br><br>[Result sent to connected text block]</p>`;
                    }
                    
                    // Update text blocks with the result
                    for (const connection of outgoingConnections) {
                        const targetBlock = document.getElementById(connection.target);
                        if (targetBlock && targetBlock.classList.contains('text-block')) {
                            targetBlock.querySelector('textarea').value = result;
                        }
                    }
                } catch (error) {
                    executionResultsDiv.innerHTML += `<p><strong>Instruction (${block.id}):</strong> Error: ${error.message}</p>`;
                    continue; // Continue with other blocks even if one fails
                }
            }
            
            // Remove visual indication from this block
            block.classList.remove('executing');
            
            // Mark this block as processed
            processedBlocks.add(currentBlockId);
            
            // Find all outgoing connections
            const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
            
            for (const connection of outgoingConnections) {
                const targetId = connection.target;
                
                // Store the output for the target block
                if (type === "Image") {
                    blockImages.set(targetId, output);
                } else {
                    if (!blockInputs.has(targetId)) {
                        blockInputs.set(targetId, []);
                    }
                    
                    // Store inputs consistently as arrays for all blocks
                    const inputs = blockInputs.get(targetId);
                    if (Array.isArray(inputs)) {
                        inputs.push(output);
                    } else {
                        blockInputs.set(targetId, [output]);
                    }
                }
                
                // Increment the processed input count for this target
                processedInputsCount.set(targetId, (processedInputsCount.get(targetId) || 0) + 1);
                
                // If we've processed all inputs for this target, add it to the queue
                if (processedInputsCount.get(targetId) >= incomingConnectionCount.get(targetId)) {
                    blocksToProcess.push(targetId);
                }
                
                // Update text blocks with their input immediately
                const targetBlock = document.getElementById(targetId);
                if (targetBlock && targetBlock.classList.contains('text-block') && 
                    targetBlock.querySelector('textarea').value.trim() === '') {
                    targetBlock.querySelector('textarea').value = output;
                }
            }
        }
        
        // Clear the execution status and finalize results
        updateExecutionStatus("Execution completed");
        setTimeout(() => {
            const statusElement = executionResultsDiv.querySelector('.execution-status');
            if (statusElement) statusElement.remove();
        }, 1000);
        
    } catch (error) {
        executionResultsDiv.innerHTML += `<p class="error">Execution failed: ${error.message}</p>`;
    } finally {
        // Reset state and remove visual indicators
        executionInProgress = false;
        executeBtn.classList.remove('executing');
        document.querySelectorAll('.block.executing').forEach(block => {
            block.classList.remove('executing');
        });
    }
}

// Helper function to update the execution status message
function updateExecutionStatus(message) {
    const executionResultsDiv = document.getElementById('execution-results');
    const statusElement = executionResultsDiv.querySelector('.execution-status');
    if (statusElement) {
        statusElement.innerHTML = `${message} <div class="spinner"></div>`;
    } else {
        executionResultsDiv.innerHTML = `<div class="execution-status">${message} <div class="spinner"></div></div>` + executionResultsDiv.innerHTML;
    }
}

// Update executeFromBlock to add execution indicators
async function executeFromBlock(startBlockId) {
    // Prevent multiple executions running simultaneously
    if (executionInProgress) return;
    executionInProgress = true;

    const executionResultsDiv = document.getElementById('execution-results');
    executionResultsDiv.innerHTML = `<div class="execution-status">Starting execution from block ${startBlockId}... <div class="spinner"></div></div>`; 
    executionResultsDiv.classList.add('visible');
    
    // Visual indication on the starting block's play button
    const startBlock = document.getElementById(startBlockId);
    const playButton = startBlock?.querySelector('.play-button');
    if (playButton) playButton.classList.add('executing');
    
    try {
        const processedBlocks = new Set();
        const blockInputs = new Map();
        const blockImages = new Map();

        // First, collect inputs from previous blocks without executing them
        const incomingConnections = window.connections.filter(conn => conn.target === startBlockId);
        
        // Gather inputs from all incoming connections
        let inputs = [];
        let imageData = null;
        
        for (const conn of incomingConnections) {
            const sourceBlock = document.getElementById(conn.source);
            if (sourceBlock) {
                if (sourceBlock.classList.contains('image-block')) {
                    const imagePreview = sourceBlock.querySelector('.image-preview');
                    if (imagePreview && imagePreview.src) {
                        imageData = imagePreview.src;
                    }
                } else {
                    inputs.push(sourceBlock.querySelector('textarea').value);
                }
            }
        }
        const input = inputs.join('\n\n');

        // Now execute from the start block forward
        let blocksToProcess = [startBlockId];
        
        while (blocksToProcess.length > 0) {
            const currentBlockId = blocksToProcess.shift();
            
            if (processedBlocks.has(currentBlockId)) continue;
            
            const block = document.getElementById(currentBlockId);
            if (!block) continue;

            // Add visual indication to the current block
            block.classList.add('executing');
            
            // Determine block type
            const isTextBlock = block.classList.contains('text-block');
            const isInstructionBlock = block.classList.contains('instruction-block');
            const isImageBlock = block.classList.contains('image-block');
            
            let type = isTextBlock ? 'Text' : (isInstructionBlock ? 'Instruction' : 'Image');
            
            // Update execution status
            updateExecutionStatus(`Processing ${type} block (${currentBlockId})...`);
            
            // Get content based on block type
            let content = '';
            let currentImageData = null;
            
            if (isTextBlock || isInstructionBlock) {
                content = block.querySelector('textarea').value;
            } else if (isImageBlock) {
                const imagePreview = block.querySelector('.image-preview');
                if (imagePreview && imagePreview.src) {
                    currentImageData = imagePreview.src;
                }
            }
            
            // Use collected input for start block, otherwise use previous block's output
            const blockInput = currentBlockId === startBlockId ? input : blockInputs.get(currentBlockId);
            // For image data, use either the existing image from the current block or from a previous block
            const blockImageData = currentBlockId === startBlockId ? imageData : (currentImageData || blockImages.get(currentBlockId));
            
            let output = '';
            
            if (type === "Text") {
                if (blockInput && content.trim() === '') {
                    block.querySelector('textarea').value = blockInput;
                    output = blockInput;
                } else {
                    output = content;
                }
                executionResultsDiv.innerHTML += `<p><span class="result-label">Text (${block.id}):</span> ${output}</p>`;
            } else if (type === "Image") {
                output = blockImageData;
                executionResultsDiv.innerHTML += `<p><span class="result-label">Image (${block.id}):</span> [Image data available for processing]</p>`;
            } else {
                try {
                    updateExecutionStatus(`Executing instruction in block ${currentBlockId}...`);
                    
                    const result = await executeInstruction(content, blockInput, blockImageData, currentBlockId);
                    output = result;
                    
                    // Find outgoing text blocks and update their content
                    const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
                    const hasTextBlockTarget = outgoingConnections.some(conn => {
                        const targetBlock = document.getElementById(conn.target);
                        return targetBlock && targetBlock.classList.contains('text-block');
                    });
                    
                    // Only show the result in execution area if not sending to a text block
                    if (!hasTextBlockTarget) {
                        executionResultsDiv.innerHTML += `<p><span class="result-label">Instruction (${block.id}):</span> Instruction: ${content}<br><br>Result: ${result}</p>`;
                    } else {
                        // Just show that the instruction was executed without showing the result at all
                        executionResultsDiv.innerHTML += `<p><span class="result-label">Instruction (${block.id}):</span> Instruction: ${content}<br><br>[Result sent to connected text block]</p>`;
                    }
                    
                    // Update text blocks with the result
                    for (const connection of outgoingConnections) {
                        const targetBlock = document.getElementById(connection.target);
                        if (targetBlock && targetBlock.classList.contains('text-block')) {
                            targetBlock.querySelector('textarea').value = result;
                        }
                    }
                } catch (error) {
                    executionResultsDiv.innerHTML += `<p><strong>Instruction (${block.id}):</strong> Error: ${error.message}</p>`;
                    break;
                }
            }

            // Remove visual indication from this block
            block.classList.remove('executing');
            processedBlocks.add(currentBlockId);

            // Find next blocks to process
            const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
            for (const conn of outgoingConnections) {
                if (type === "Image") {
                    blockImages.set(conn.target, output);
                } else {
                    blockInputs.set(conn.target, output);
                }
                blocksToProcess.push(conn.target);
            }
        }
        
        // Clear the execution status indicator
        updateExecutionStatus("Execution completed");
        setTimeout(() => {
            const statusElement = executionResultsDiv.querySelector('.execution-status');
            if (statusElement) statusElement.remove();
        }, 1000);
        
    } catch (error) {
        executionResultsDiv.innerHTML += `<p class="error">Execution failed: ${error.message}</p>`;
    } finally {
        // Reset state and remove visual indicators
        executionInProgress = false;
        if (playButton) playButton.classList.remove('executing');
        document.querySelectorAll('.block.executing').forEach(block => {
            block.classList.remove('executing');
        });
    }
}

export { executeWorkflow, executeFromBlock };