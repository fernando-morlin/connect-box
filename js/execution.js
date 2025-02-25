// js/execution.js

import { executeInstruction } from './api-calls.js';

async function executeWorkflow(workflowArea) {
    const executionResultsDiv = document.getElementById('execution-results');
    executionResultsDiv.innerHTML = ''; // Clear previous results
    executionResultsDiv.classList.add('visible');
    let currentBlockId = null;

    // Track which blocks have been processed
    const updatedBlocks = new Set();

    // Store input data for blocks
    const blockInputs = new Map();

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

    for (const startBlock of startBlocks) {
        currentBlockId = startBlock;
        let output = '';

        while (currentBlockId) {
            const block = document.getElementById(currentBlockId);
            if (!block) {
                executionResultsDiv.innerHTML += `<p>Error: Block with ID ${currentBlockId} not found.</p>`;
                break;
            }

            const type = block.classList.contains('text-block') ? 'Text' : 'Instruction';
            const content = block.querySelector('textarea').value;
            const input = blockInputs.get(currentBlockId) || '';

            if (type === "Text") {

                if ((input && content.trim() === '') || updatedBlocks.has(currentBlockId)) {
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
                    break; // Stop on error
                }
            }


            let nextConnection = window.connections.find(conn => conn.source === currentBlockId);
            currentBlockId = nextConnection ? nextConnection.target : null;

            if (currentBlockId && output) {
                blockInputs.set(currentBlockId, output);

                const nextBlock = document.getElementById(currentBlockId);
                if (nextBlock && nextBlock.classList.contains('text-block')) {
                    updatedBlocks.add(currentBlockId);
                    nextBlock.querySelector('textarea').value = output;
                }
            }
        }
    }
}



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