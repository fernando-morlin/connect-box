// js/block-dragging.js
import { createElement } from './utils.js';
import { updateConnections, validateConnection } from './block-connection.js';

let isDragging = false;
let isConnecting = false;
let dragTarget = null;
let connectStart = null;
let temporaryLine = null;

function startDrag(event) {
    // Don't initiate dragging when clicking on textarea, buttons or resize handle
    if (event.target.tagName === 'TEXTAREA' || 
        event.target.tagName === 'BUTTON' || 
        event.target.classList.contains('resize-handle')) {
        return;
    }
    
    const workflowArea = document.getElementById('workflow-area');
    isDragging = true;
    dragTarget = event.target.closest('.block'); // Find the closest parent with class 'block'

    if (event.target.classList.contains('handle')) {
        isConnecting = true;
        connectStart = {
            blockId: dragTarget.id,
            handleType: event.target.classList.contains('left') ? 'left' : 'right'
        };
        // Create temporary line
        const startHandle = event.target.getBoundingClientRect();
        const workflowAreaRect = workflowArea.getBoundingClientRect();
        const x1 = startHandle.left + startHandle.width / 2 - workflowAreaRect.left;
        const y1 = startHandle.top + startHandle.height / 2 - workflowAreaRect.top;

        temporaryLine = createElement('svg', 'connection-line', {
            width: 0,
            height: 0,
            style: `left: ${x1}px; top: ${y1}px;`
        });
        const path = createElement('line', null, {
            x1: 0,
            y1: 0,
            x2: 0, // Initialize x2 and y2
            y2: 0, // Initialize x2 and y2
            stroke: '#999',
            'stroke-width': 2
        });
        temporaryLine.appendChild(path);
        workflowArea.appendChild(temporaryLine);

        event.preventDefault(); // Prevent text selection during drag
    } else {
        // Calculate offset within the block
        const rect = dragTarget.getBoundingClientRect();
        dragTarget.offsetX = event.clientX - rect.left;
        dragTarget.offsetY = event.clientY - rect.top;
    }
}

function doDrag(event) {
    const workflowArea = document.getElementById('workflow-area');
    if (!isDragging) return;

    if (isConnecting && temporaryLine) {
        // Update temporary line
        const startHandle = document.getElementById(connectStart.blockId).querySelector(`.handle.${connectStart.handleType}`).getBoundingClientRect();
        const workflowAreaRect = workflowArea.getBoundingClientRect();
        const x1 = startHandle.left + startHandle.width / 2 - workflowAreaRect.left;
        const y1 = startHandle.top + startHandle.height / 2 - workflowAreaRect.top;

        const x2 = event.clientX - workflowAreaRect.left;
        const y2 = event.clientY - workflowAreaRect.top;

        // Calculate the top-left corner of the SVG element
        const svgLeft = Math.min(x1, x2);
        const svgTop = Math.min(y1, y2);

        // Update SVG element dimensions and position
        temporaryLine.style.left = `${svgLeft}px`;
        temporaryLine.style.top = `${svgTop}px`;
        temporaryLine.setAttribute('width', Math.abs(x2 - x1));
        temporaryLine.setAttribute('height', Math.abs(y2 - y1));

        // Update line coordinates
        const path = temporaryLine.querySelector('line');
        path.setAttribute('x1', x1 < x2 ? 0 : Math.abs(x2 - x1));
        path.setAttribute('y1', y1 < y2 ? 0 : Math.abs(y2 - y1));
        path.setAttribute('x2', x1 < x2 ? Math.abs(x2 - x1) : 0);
        path.setAttribute('y2', y1 < y2 ? Math.abs(y2 - y1) : 0);

    } else {
        // Block dragging
        if (dragTarget) {
            const x = event.clientX - workflowArea.offsetLeft - dragTarget.offsetX;
            const y = event.clientY - workflowArea.offsetTop - dragTarget.offsetY;
            dragTarget.style.left = `${x}px`;
            dragTarget.style.top = `${y}px`;
            updateConnections(workflowArea); // Update connections when dragging
        }

    }
}

function endDrag(event) {
    const workflowArea = document.getElementById('workflow-area');
    if (!isDragging) return;

    if (temporaryLine) {
        temporaryLine.remove();
        temporaryLine = null;
    }

    if (isConnecting) {
        const targetElement = document.elementFromPoint(event.clientX, event.clientY);
        const targetBlock = targetElement?.closest('.block');

        if (targetBlock && targetBlock.id !== connectStart.blockId) {
            // Check if connecting to the opposite handle type.
            const targetHandle = targetElement.closest('.handle');
            const targetHandleType = targetHandle?.classList.contains('left') ? 'left' : (targetHandle?.classList.contains('right') ? 'right' : null);

            // Allow connections from right to left, and left to right
            if ((connectStart.handleType === 'right' && targetHandleType === 'left') ||
                (connectStart.handleType === 'left' && targetHandleType === 'right')) {

                // Check for existing connection
                const existingConnection = window.connections.find(c =>
                    (c.source === connectStart.blockId && c.target === targetBlock.id) ||
                    (c.source === targetBlock.id && c.target === connectStart.blockId)
                );

                if (!existingConnection) {
                    // Determine direction
                    const source = connectStart.handleType === 'right' ? connectStart.blockId : targetBlock.id;
                    const target = connectStart.handleType === 'right' ? targetBlock.id : connectStart.blockId;

                    if (validateConnection(source, target)) {
                        window.connections.push({ source, target }); // Corrected
                        updateConnections(workflowArea); // Redraw
                    } else {
                        const statusDisplay = targetBlock.querySelector('.connection-status');
                        statusDisplay.textContent = 'Cyclic connection detected!';
                        statusDisplay.classList.add('visible');
                        setTimeout(() => statusDisplay.classList.remove('visible'), 2000);
                    }

                } else {
                    const statusDisplay = targetBlock.querySelector('.connection-status');
                    statusDisplay.textContent = 'Connection already exists!';
                    statusDisplay.classList.add('visible');
                    setTimeout(() => statusDisplay.classList.remove('visible'), 2000);
                }
            }
        }
    }

    isDragging = false;
    isConnecting = false;
    dragTarget = null;
    connectStart = null;
}

export { startDrag, doDrag, endDrag };