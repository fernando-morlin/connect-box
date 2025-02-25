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
            executionResultsDiv.innerHTML += `<p><strong>Text Block (${block.id}):</strong> ${output}</p>`;
        } else {
            try {
                const result = await executeInstruction(content, input);
                output = result;
                executionResultsDiv.innerHTML += `<p><strong>Instruction Block (${block.id}):</strong> Result: ${result}</p>`;
            } catch (error) {
                executionResultsDiv.innerHTML += `<p><strong>Instruction Block (${block.id}):</strong> Error: ${error.message}</p>`;
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
    executionResultsDiv.innerHTML += `<p><strong>Executing from block:</strong> ${startBlockId}</p>`;

    const updatedBlocks = new Set();
    const blockInputs = new Map();

    const incomingConnections = window.connections.filter(conn => conn.target === startBlockId);
    let input = '';

    if (incomingConnections.length > 0) {
        executionResultsDiv.innerHTML += `<p><em>Note: Starting execution from this point.  Input from previous blocks will not be used.</em></p>`;
    }

    let currentBlockId = startBlockId;
    let output = '';


    const startBlock = document.getElementById(currentBlockId);
    if (!startBlock) {
        executionResultsDiv.innerHTML += `<p>Error: Starting block with ID ${currentBlockId} not found.</p>`;
        return;
    }

    while (currentBlockId) {
        const block = document.getElementById(currentBlockId);
        if (!block) {
            executionResultsDiv.innerHTML += `<p>Error: Block with ID ${currentBlockId} not found.</p>`;
            break;
        }

        const type = block.classList.contains('text-block') ? 'Text' : 'Instruction';
        const content = block.querySelector('textarea').value;
        const blockInput = blockInputs.get(currentBlockId) || input;

        if (type === "Text") {
            if ((blockInput && content.trim() === '') || updatedBlocks.has(currentBlockId)) {
                block.querySelector('textarea').value = blockInput;
                output = blockInput;
            } else {
                output = content;
            }
            executionResultsDiv.innerHTML += `<p><strong>Text Block (${block.id}):</strong> ${output}</p>`;
        } else {
            try {
                const result = await executeInstruction(content, blockInput);
                output = result;
                executionResultsDiv.innerHTML += `<p><strong>Instruction Block (${block.id}):</strong> Result: ${result}</p>`;
            } catch (error) {
                executionResultsDiv.innerHTML += `<p><strong>Instruction Block (${block.id}):</strong> Error: ${error.message}</p>`;
                break;
            }
        }

        updatedBlocks.add(currentBlockId);
        let nextConnection = window.connections.find(conn => conn.source === currentBlockId);
        currentBlockId = nextConnection ? nextConnection.target : null;

        if (currentBlockId && output) {
            blockInputs.set(currentBlockId, output);

            const nextBlock = document.getElementById(currentBlockId);
            if (nextBlock && nextBlock.classList.contains('text-block')) {
                if (nextBlock.querySelector('textarea').value.trim() === '' || updatedBlocks.has(currentBlockId)) {
                    nextBlock.querySelector('textarea').value = output;
                }
            }
        }
    }
}
export { executeWorkflow, executeFromBlock };