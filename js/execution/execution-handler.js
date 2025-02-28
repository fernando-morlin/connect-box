// js/execution/execution-handler.js

import { executeInstruction } from '../api-calls.js';
import { updateExecutionStatus } from './execution-ui-updates.js';

// Add execution state tracking
let executionInProgress = false;

async function processBlock(block, blockInputs, blockImages, incomingConnectionCount, processedInputsCount, processedBlocks, executionResultsDiv) {
    const currentBlockId = block.id;
    if (processedBlocks.has(currentBlockId)) return null;

    // Add visual indication to the current block
    block.classList.add('executing');

    const incomingCount = incomingConnectionCount.get(currentBlockId) || 0;
    const processedCount = processedInputsCount.get(currentBlockId) || 0;

    // If this block has incoming connections and we haven't processed all inputs yet
    if (incomingCount > 0 && processedCount < incomingCount) {
        // Skip for now, will process later when all inputs are ready
        block.classList.remove('executing');
        return null;
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
        updateExecutionStatus(`Processing ${type} block (${block.id})...`, executionResultsDiv);

        executionResultsDiv.innerHTML += `<p><span class="result-label">Text (${block.id}):</span> ${output}</p>`;
    } else if (type === "Image") {
        output = imageData;
        // Update live status in results area
        updateExecutionStatus(`Processing ${type} block (${block.id})...`, executionResultsDiv);

        executionResultsDiv.innerHTML += `<p><span class="result-label">Image (${block.id}):</span> [Image data available for processing]</p>`;
    } else {
        try {
            // Update live status in results area for API call
            updateExecutionStatus(`Executing instruction in block ${block.id}...`, executionResultsDiv);

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
            block.classList.remove('executing');
            return error; // Returning error object instead of continue
        }
    }

    // Remove visual indication from this block
    block.classList.remove('executing');

    // Mark this block as processed
    processedBlocks.add(currentBlockId);

    return { output, type };
}

export { processBlock, executionInProgress };