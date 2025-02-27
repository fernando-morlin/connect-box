// js/block-connection.js
import { createElement } from './utils.js';
import { getCurrentZoom } from './zoom-handler.js'; // Import zoom functionality

window.connections = []; // Keep connections in global scope

function updateConnections(workflowArea) {
    // Get the content container where all blocks are placed
    const workflowContent = workflowArea.querySelector('.workflow-content') || workflowArea;
    
    // Remove existing lines
    workflowContent.querySelectorAll('.connection-line').forEach(line => {
        if (!line.classList.contains('temporary-connection')) {
            line.remove();
        }
    });

    // Get or create the connections container and apply the same transform
    let connectionsContainer = workflowContent.querySelector('.connections-container');
    if (!connectionsContainer) {
        connectionsContainer = document.createElement('div');
        connectionsContainer.className = 'connections-container';
        connectionsContainer.style.position = 'absolute';
        connectionsContainer.style.top = '0';
        connectionsContainer.style.left = '0';
        connectionsContainer.style.width = '100%';
        connectionsContainer.style.height = '100%';
        connectionsContainer.style.pointerEvents = 'none';
        connectionsContainer.style.zIndex = '1';
        
        // Important: Insert before any content so that it's affected by the same transform
        workflowContent.insertBefore(connectionsContainer, workflowContent.firstChild);
    }

    connectionsContainer.innerHTML = '';
    
    // NEW: Important - make sure the container doesn't have its own transform
    connectionsContainer.style.transform = 'none';

    window.connections.forEach(conn => {
        const sourceBlock = document.getElementById(conn.source);
        const targetBlock = document.getElementById(conn.target);

        if (sourceBlock && targetBlock) {
            const sourceHandle = sourceBlock.querySelector('.handle.right');
            const targetHandle = targetBlock.querySelector('.handle.left');

            if (!sourceHandle || !targetHandle) return;

            // NEW: Get positions using offsetLeft/offsetTop which are unaffected by transforms
            // Calculate position relative to workflow content
            let sourceX = 0, sourceY = 0;
            let targetX = 0, targetY = 0;
            
            // Walk up the DOM to get accumulated offsets (without transform effects)
            let element = sourceHandle;
            while (element && element !== workflowContent) {
                sourceX += element.offsetLeft;
                sourceY += element.offsetTop;
                element = element.offsetParent;
            }
            
            element = targetHandle;
            while (element && element !== workflowContent) {
                targetX += element.offsetLeft;
                targetY += element.offsetTop;
                element = element.offsetParent;
            }
            
            // Adjust for handle center
            sourceX += sourceHandle.offsetWidth / 2;
            sourceY += sourceHandle.offsetHeight / 2;
            targetX += targetHandle.offsetWidth / 2;
            targetY += targetHandle.offsetHeight / 2;

            // Create SVG in the natural coordinates (before transform)
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "connection-line");
            svg.style.position = "absolute";
            
            // Define bounds that contain both points with padding
            const padding = 50; // Padding to accommodate curve control points
            const left = Math.min(sourceX, targetX) - padding;
            const top = Math.min(sourceY, targetY) - padding;
            const width = Math.abs(targetX - sourceX) + (padding * 2);
            const height = Math.abs(targetY - sourceY) + (padding * 2);
            
            svg.style.left = left + "px";
            svg.style.top = top + "px";
            svg.style.width = width + "px";
            svg.style.height = height + "px";
            
            // Calculate relative coordinates within the SVG viewbox
            const relSourceX = sourceX - left;
            const relSourceY = sourceY - top;
            const relTargetX = targetX - left;
            const relTargetY = targetY - top;
            
            // Create curved path 
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // Calculate control points for the curve
            // Control point distance: 1/3 of the horizontal distance between points
            const distance = Math.abs(relTargetX - relSourceX) / 3;
            
            // Define path using cubic bezier curve
            const d = `M ${relSourceX} ${relSourceY} 
                      C ${relSourceX + distance} ${relSourceY},
                        ${relTargetX - distance} ${relTargetY},
                        ${relTargetX} ${relTargetY}`;
            
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            
            // Check if we're in engineering theme
            const isEngineeringTheme = document.body.classList.contains('engineering-theme');
            
            // Apply appropriate styling based on theme
            if (isEngineeringTheme) {
                path.setAttribute("stroke", "#1B3B4B");
                path.setAttribute("stroke-width", "3");
            } else {
                path.setAttribute("stroke", "#000");
                path.setAttribute("stroke-width", "4");
            }
            
            svg.appendChild(path);
            connectionsContainer.appendChild(svg);
        }
    });
}

function deleteBlock(blockId, workflowArea) {
    // Remove the block
    const block = document.getElementById(blockId);
    if (block) {
        block.remove();
    }

    // Remove any connections involving this block
    window.connections = window.connections.filter(conn => conn.source !== blockId && conn.target !== blockId);

    // Redraw the connections
    updateConnections(workflowArea);
}


function validateConnection(sourceId, targetId) {
    // Check for cyclic connections
    const visited = new Set();

    function hasCycle(currentId) {
        if (visited.has(currentId)) return true;
        visited.add(currentId);

        const nextConnections = window.connections.filter(conn => conn.source === currentId);
        for (const conn of nextConnections) {
            if (hasCycle(conn.target)) return true;
        }

        visited.delete(currentId);
        return false;
    }

    // Temporarily add the new connection
    window.connections.push({ source: sourceId, target: targetId });
    const hasCycles = hasCycle(sourceId);
    window.connections.pop(); // Remove the temporary connection

    return !hasCycles;
}


export { updateConnections, deleteBlock, validateConnection };