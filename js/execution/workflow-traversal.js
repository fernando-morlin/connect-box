// js/execution/workflow-traversal.js
import { processBlock, executionInProgress } from './execution-handler.js';
import { updateExecutionStatus, resetUI } from './execution-ui-updates.js';

// Generic function to execute workflow from a starting point
async function executeWorkflow(workflowArea, startBlockId = null) {
    if (executionInProgress) return;
    executionInProgress = true;

    const executionResultsDiv = document.getElementById('execution-results');
    const executeBtn = document.querySelector('.execute');

    try {
        // Prepare the UI and data structures
        executionResultsDiv.innerHTML = `<div class="execution-status">${startBlockId ? `Starting execution from block ${startBlockId}...` : 'Execution in progress...'} <div class="spinner"></div></div>`;
        executionResultsDiv.classList.add('visible');
        if(startBlockId === null){
            executeBtn.classList.add('executing');
        }

        const processedBlocks = new Set();
        const blockInputs = new Map();
        const blockImages = new Map();
        const incomingConnectionCount = new Map();

        window.connections.forEach(conn => {
            const target = conn.target;
            incomingConnectionCount.set(target, (incomingConnectionCount.get(target) || 0) + 1);
        });

        // Determine start blocks
        let startBlocks;
        if (startBlockId) {
            startBlocks = [startBlockId];
        } else {
            startBlocks = window.connections
                .filter(el => !window.connections.some(innEl => innEl.target === el.source))
                .map(el => el.source);

            const allBlocks = Array.from(document.querySelectorAll('.block')).map(block => block.id);
            allBlocks.forEach(blockId => {
                if (!window.connections.some(conn => conn.source === blockId || conn.target === blockId)) {
                    startBlocks.push(blockId);
                }
            });
        }

        if (startBlocks.length === 0 && window.connections.length > 0) {
            executionResultsDiv.innerHTML = "<p>Error: The workflow has a cycle or is not properly connected.</p>";
            return;
        }

        const processedInputsCount = new Map();
        let blocksToProcess = [...startBlocks];

        // Process each block in the workflow
        while (blocksToProcess.length > 0) {
            const currentBlockId = blocksToProcess.shift();
            const block = document.getElementById(currentBlockId);

            if (!block) {
                executionResultsDiv.innerHTML += `<p>Error: Block with ID ${currentBlockId} not found.</p>`;
                continue;
            }

            // Process the block and handle errors
            const result = await processBlock(block, blockInputs, blockImages, incomingConnectionCount, processedInputsCount, processedBlocks, executionResultsDiv);

            if (result && result instanceof Error) {
                break; // Stop processing on error
            }

            // Update block outputs and propagate them to the next blocks
            if (result) {
                const { output, type } = result;
                const outgoingConnections = window.connections.filter(conn => conn.source === currentBlockId);

                for (const connection of outgoingConnections) {
                    const targetId = connection.target;

                    if (type === "Image") {
                        blockImages.set(targetId, output);
                    } else {
                        if (!blockInputs.has(targetId)) {
                            blockInputs.set(targetId, []);
                        }

                        const inputs = blockInputs.get(targetId);
                        if (Array.isArray(inputs)) {
                            inputs.push(output);
                        } else {
                            blockInputs.set(targetId, [output]);
                        }
                    }

                    processedInputsCount.set(targetId, (processedInputsCount.get(targetId) || 0) + 1);

                    if (processedInputsCount.get(targetId) >= incomingConnectionCount.get(targetId)) {
                        const targetBlock = document.getElementById(targetId);
                        if(targetBlock){
                             blocksToProcess.push(targetId);
                             // Update text blocks with their input immediately
                             if (targetBlock && targetBlock.classList.contains('text-block') && 
                                 targetBlock.querySelector('textarea').value.trim() === '') {
                                targetBlock.querySelector('textarea').value = output;
                            }
                        }
                    }

                }
            }
        }

        // Finalize execution and reset UI
        updateExecutionStatus("Execution completed", executionResultsDiv);
        setTimeout(() => {
            const statusElement = executionResultsDiv.querySelector('.execution-status');
            if (statusElement) statusElement.remove();
        }, 1000);

    } catch (error) {
        executionResultsDiv.innerHTML += `<p class="error">Execution failed: ${error.message}</p>`;
    } finally {
        executionInProgress = false;
        resetUI(executeBtn);
    }
}

export { executeWorkflow };