// js/execution.js

import { executeInstruction } from './api-calls.js';

async function executeWorkflow(workflowArea) {
    const executionResultsDiv = document.getElementById('execution-results');
    executionResultsDiv.innerHTML = ''; // Clear previous results
    executionResultsDiv.classList.add('visible');

    // Track which blocks have been processed
    const processedBlocks = new Set();
    
    // Store input data for blocks
    const blockInputs = new Map();
    
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
        executionResultsDiv.innerHTML += "<p>Error: The workflow has a cycle or is not properly connected.</p>";
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
        
        const incomingCount = incomingConnectionCount.get(currentBlockId) || 0;
        const processedCount = processedInputsCount.get(currentBlockId) || 0;
        
        // If this block has incoming connections and we haven't processed all inputs yet
        if (incomingCount > 0 && processedCount < incomingCount) {
            // Skip for now, will process later when all inputs are ready
            continue;
        }
        
        const type = block.classList.contains('text-block') ? 'Text' : 'Instruction';
        const content = block.querySelector('textarea').value;
        
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
        
        let output = '';
        
        if (type === "Text") {
            if ((input && content.trim() === '')) {
                block.querySelector('textarea').value = input;
                output = input;
            } else {
                output = content;
            }
            executionResultsDiv.innerHTML += `<p><span class="result-label">Text (${block.id}):</span> ${output}</p>`;
        } else {
            try {
                const result = await executeInstruction(content, input);
                output = result;
                executionResultsDiv.innerHTML += `<p><span class="result-label">Instruction (${block.id}):</span> Result: ${result}</p>`;
                
                // Find outgoing text blocks and update their content
                const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
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
        
        // Mark this block as processed
        processedBlocks.add(currentBlockId);
        
        // Find all outgoing connections
        const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
        
        for (const connection of outgoingConnections) {
            const targetId = connection.target;
            
            // Store the output for the target block
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
}

// Keep the executeFromBlock function the same
async function executeFromBlock(startBlockId) {
    const executionResultsDiv = document.getElementById('execution-results');
    executionResultsDiv.innerHTML = ''; // Clear
    executionResultsDiv.classList.add('visible');
    
    const processedBlocks = new Set();
    const blockInputs = new Map();

    // First, collect inputs from previous blocks without executing them
    const incomingConnections = window.connections.filter(conn => conn.target === startBlockId);
    
    // Gather inputs from all incoming connections
    let inputs = [];
    for (const conn of incomingConnections) {
        const sourceBlock = document.getElementById(conn.source);
        if (sourceBlock) {
            inputs.push(sourceBlock.querySelector('textarea').value);
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

        const type = block.classList.contains('text-block') ? 'Text' : 'Instruction';
        const content = block.querySelector('textarea').value;
        
        // Use collected input for start block, otherwise use previous block's output
        const blockInput = currentBlockId === startBlockId ? input : blockInputs.get(currentBlockId);
        
        let output = '';
        if (type === "Text") {
            if (blockInput && content.trim() === '') {
                block.querySelector('textarea').value = blockInput;
                output = blockInput;
            } else {
                output = content;
            }
            executionResultsDiv.innerHTML += `<p><span class="result-label">Text (${block.id}):</span> ${output}</p>`;
        } else {
            try {
                const result = await executeInstruction(content, blockInput);
                output = result;
                executionResultsDiv.innerHTML += `<p><span class="result-label">Instruction (${block.id}):</span> Result: ${result}</p>`;
                
                // Add this section to update outgoing text blocks
                const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
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

        processedBlocks.add(currentBlockId);

        // Find next blocks to process
        const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);
        for (const conn of outgoingConnections) {
            blockInputs.set(conn.target, output);
            blocksToProcess.push(conn.target);
        }
    }
}
export { executeWorkflow, executeFromBlock };