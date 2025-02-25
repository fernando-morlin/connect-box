// js/block-creation.js
import { createElement } from './utils.js';
import { startDrag } from './block-dragging.js';
import { deleteBlock } from './block-connection.js'
import { executeFromBlock } from './execution.js';

let blockCount = 0;

function createBlock(type, x, y, workflowArea) {
    try {
        if (!['text', 'instruction'].includes(type)) {
            throw new Error('Invalid block type');
        }

        blockCount++;
        const block = createElement('div', `block ${type}-block`);
        block.id = `${type}-${blockCount}`;

        // Ensure blocks are created within viewport
        const maxX = workflowArea.clientWidth - 200;  // 200 is min block width
        const maxY = workflowArea.clientHeight - 100; // 100 is min block height
        block.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
        block.style.top = `${Math.min(Math.max(0, y), maxY)}px`;

        const label = createElement('div', 'block-label');
        label.textContent = type === 'text' ? 'Text Block' : 'Instruction Block';
        block.appendChild(label);


        const textarea = createElement('textarea', '', { placeholder: type === 'text' ? 'Enter text...' : 'Enter instructions...' });
        block.appendChild(textarea);

        // Add both input and output handles
        const leftHandle = createElement('div', 'handle left');
        block.appendChild(leftHandle);
        const rightHandle = createElement('div', 'handle right');
        block.appendChild(rightHandle);


        const deleteButton = createElement('button', 'delete-button');
        deleteButton.textContent = 'x';
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent block dragging
            deleteBlock(block.id, workflowArea);
        });

        block.appendChild(deleteButton);

        // Add play button to instruction blocks only
        if (type === 'instruction') {
            const playButton = createElement('button', 'play-button');
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            playButton.title = "Run from this block";
            playButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent block dragging
                executeFromBlock(block.id);
            });
            block.appendChild(playButton);
        }
        const connectionStatus = createElement('div', 'connection-status');
        block.appendChild(connectionStatus);


        block.addEventListener('mousedown', startDrag);
        workflowArea.appendChild(block);
        return block;
    } catch (error) {
        console.error('Error creating block:', error);
        return null;
    }
}

export { createBlock };