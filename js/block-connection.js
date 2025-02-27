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
            
            const minDimension = 10;
            const width = Math.max(Math.abs(targetX - sourceX), minDimension);
            const height = Math.max(Math.abs(targetY - sourceY), minDimension);
            
            const left = Math.min(sourceX, targetX) - (width === minDimension ? minDimension/2 : 0);
            const top = Math.min(sourceY, targetY) - (height === minDimension ? minDimension/2 : 0);
            
            svg.style.left = left + "px";
            svg.style.top = top + "px";
            svg.style.width = width + "px";
            svg.style.height = height + "px";

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", sourceX < targetX ? 0 : width);
            line.setAttribute("y1", sourceY < targetY ? 0 : height);
            line.setAttribute("x2", sourceX < targetX ? width : 0);
            line.setAttribute("y2", sourceY < targetY ? height : 0);
            line.setAttribute("stroke", "#000");
            line.setAttribute("stroke-width", "4");

            svg.appendChild(line);
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