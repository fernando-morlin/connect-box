// js/block-dragging.js
import { createElement } from './utils.js';
import { updateConnections, validateConnection } from './block-connection.js';
import { getCurrentZoom } from './zoom-handler.js'; // Import zoom functionality

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
    const workflowContent = workflowArea.querySelector('.workflow-content');
    
    isDragging = true;
    dragTarget = event.target.closest('.block'); // Find the closest parent with class 'block'

    if (event.target.classList.contains('handle')) {
        isConnecting = true;
        connectStart = {
            blockId: dragTarget.id,
            handleType: event.target.classList.contains('left') ? 'left' : 'right'
        };
        
        // Create SVG element for the temporary connection
        temporaryLine = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        temporaryLine.classList.add('connection-line', 'temporary-connection');
        temporaryLine.style.position = "absolute";
        temporaryLine.style.zIndex = "1000";

        // Create the path element inside SVG (instead of a line)
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-dasharray", "8,4");

        // Apply theme-specific styling
        if (document.body.classList.contains('engineering-theme')) {
            path.setAttribute("stroke", "#3A6F62");
            path.setAttribute("stroke-width", "3");
        } else {
            path.setAttribute("stroke", "#06d6a0");
            path.setAttribute("stroke-width", "4");
        }

        temporaryLine.appendChild(path);
        workflowContent.appendChild(temporaryLine);

        event.preventDefault(); // Prevent text selection during drag
    } else {
        // Calculate offset within the block, accounting for zoom
        const rect = dragTarget.getBoundingClientRect();
        const zoomFactor = getCurrentZoom();
        
        // Adjust offset for the current zoom level
        dragTarget.offsetX = (event.clientX - rect.left) / zoomFactor;
        dragTarget.offsetY = (event.clientY - rect.top) / zoomFactor;
    }
}

function doDrag(event) {
    const workflowArea = document.getElementById('workflow-area');
    const workflowContent = workflowArea.querySelector('.workflow-content');
    if (!isDragging) return;
    
    // Get current zoom level
    const zoomFactor = getCurrentZoom();

    // Updated code for the temporaryLine in doDrag function in js/block-dragging.js
    if (isConnecting && temporaryLine) {
        const workflowRect = workflowContent.getBoundingClientRect();
        
        // Get the handle that started the connection
        const handle = document.getElementById(connectStart.blockId).querySelector(`.handle.${connectStart.handleType}`);
        const handleRect = handle.getBoundingClientRect();
        
        // Calculate handle center position relative to workflow area, adjusted for zoom
        const handleX = (handleRect.left - workflowRect.left) / zoomFactor + handleRect.width/(2*zoomFactor);
        const handleY = (handleRect.top - workflowRect.top) / zoomFactor + handleRect.height/(2*zoomFactor);
        
        // Calculate mouse position relative to workflow area, adjusted for zoom
        const mouseX = (event.clientX - workflowRect.left) / zoomFactor;
        const mouseY = (event.clientY - workflowRect.top) / zoomFactor;
        
        // Determine which is the start point and which is the end point
        const x1 = connectStart.handleType === 'left' ? mouseX : handleX;
        const y1 = connectStart.handleType === 'left' ? mouseY : handleY;
        const x2 = connectStart.handleType === 'left' ? handleX : mouseX;
        const y2 = connectStart.handleType === 'left' ? handleY : mouseY;
        
        // Add padding for the control points
        const padding = 50;
        const minX = Math.min(x1, x2) - padding; 
        const minY = Math.min(y1, y2) - padding;
        const width = Math.abs(x2 - x1) + (padding * 2); 
        const height = Math.abs(y2 - y1) + (padding * 2);
        
        const minDimension = 20;
        const svgWidth = Math.max(width, minDimension);
        const svgHeight = Math.max(height, minDimension);
        
        // Position the SVG
        temporaryLine.style.left = `${minX}px`;
        temporaryLine.style.top = `${minY}px`;
        temporaryLine.style.width = `${svgWidth}px`;
        temporaryLine.style.height = `${svgHeight}px`;
        
        // Calculate relative coordinates within the SVG
        const relX1 = x1 - minX;
        const relY1 = y1 - minY;
        const relX2 = x2 - minX;
        const relY2 = y2 - minY;
        
        // Calculate control points for the curve
        // Control point distance: 1/3 of the horizontal distance between points
        const distance = Math.abs(relX2 - relX1) / 3;
        
        // Update or create the path element
        let path = temporaryLine.querySelector('path');
        if (!path) {
            // Remove the line if it exists
            const line = temporaryLine.querySelector('line');
            if (line) {
                line.remove();
            }
            
            // Create a path element
            path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", "none");
            temporaryLine.appendChild(path);
        }
        
        // Define curved path using cubic bezier
        const d = `M ${relX1} ${relY1} 
                  C ${relX1 + distance} ${relY1},
                    ${relX2 - distance} ${relY2},
                    ${relX2} ${relY2}`;
        
        path.setAttribute("d", d);
        
        // Apply styling based on theme
        if (document.body.classList.contains('engineering-theme')) {
            path.setAttribute("stroke", "#3A6F62");
            path.setAttribute("stroke-width", "3");
            path.setAttribute("stroke-dasharray", "8,4");
        } else {
            path.setAttribute("stroke", "#06d6a0");
            path.setAttribute("stroke-width", "4");
            path.setAttribute("stroke-dasharray", "8,4");
        }
    } else {
        // Block dragging
        if (dragTarget) {
            // Adjust coordinates for zoom level
            const contentRect = workflowContent.getBoundingClientRect();
            const x = (event.clientX - contentRect.left) / zoomFactor - dragTarget.offsetX;
            const y = (event.clientY - contentRect.top) / zoomFactor - dragTarget.offsetY;
            
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
                        window.connections.push({ source, target });
                        updateConnections(workflowArea); // Redraw
                        
                        // Add visual feedback for successful connection
                        const sourceBlock = document.getElementById(source);
                        const targetBlock = document.getElementById(target);
                        
                        // Enhanced visual feedback with inline styles to ensure it works
                        [sourceBlock, targetBlock].forEach(block => {
                            block.classList.add('connection-flash');
                            
                            // Backup with direct styling in case the CSS animation isn't working
                            const originalBoxShadow = block.style.boxShadow;
                            block.style.boxShadow = '8px 8px 0px #06d6a0';
                            
                            setTimeout(() => {
                                block.classList.remove('connection-flash');
                                block.style.boxShadow = originalBoxShadow;
                            }, 500);
                        });
                    } else {
                        const statusDisplay = targetBlock.querySelector('.connection-status');
                        statusDisplay.textContent = 'Cyclic connection detected!';
                        statusDisplay.classList.add('visible');
                        
                        // Ensure visibility with inline styles
                        statusDisplay.style.opacity = '1';
                        statusDisplay.style.display = 'block';
                        
                        setTimeout(() => {
                            statusDisplay.classList.remove('visible');
                            statusDisplay.style.opacity = '0';
                        }, 2000);
                    }
                } else {
                    const statusDisplay = targetBlock.querySelector('.connection-status');
                    statusDisplay.textContent = 'Connection already exists!';
                    statusDisplay.classList.add('visible');
                    
                    // Ensure visibility with inline styles
                    statusDisplay.style.opacity = '1';
                    statusDisplay.style.display = 'block';
                    
                    setTimeout(() => {
                        statusDisplay.classList.remove('visible');
                        statusDisplay.style.opacity = '0';
                    }, 2000);
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