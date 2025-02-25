// js/block-connection.js
import { createElement } from './utils.js';

window.connections = []; // Keep connections in global scope

function updateConnections(workflowArea) {
    // Remove existing lines
    document.querySelectorAll('.connection-line').forEach(line => line.remove());

    window.connections.forEach(conn => {
        const sourceBlock = document.getElementById(conn.source);
        const targetBlock = document.getElementById(conn.target);

        if (sourceBlock && targetBlock) {
            const sourceHandle = sourceBlock.querySelector('.handle.right');
            const targetHandle = targetBlock.querySelector('.handle.left');

            if (!sourceHandle || !targetHandle) return;

            // Get positions relative to workflow area
            const workflowRect = workflowArea.getBoundingClientRect();
            const sourceRect = sourceHandle.getBoundingClientRect();
            const targetRect = targetHandle.getBoundingClientRect();

            // Calculate positions
            const x1 = sourceRect.left + sourceRect.width / 2 - workflowRect.left;
            const y1 = sourceRect.top + sourceRect.height / 2 - workflowRect.top;
            const x2 = targetRect.left + targetRect.width / 2 - workflowRect.left;
            const y2 = targetRect.top + targetRect.height / 2 - workflowRect.top;

            // Create SVG container
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "connection-line");
            svg.style.position = "absolute";
            svg.style.left = Math.min(x1, x2) + "px";
            svg.style.top = Math.min(y1, y2) + "px";
            svg.style.width = Math.abs(x2 - x1) + "px";
            svg.style.height = Math.abs(y2 - y1) + "px";

            // Create line element
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1 < x2 ? 0 : Math.abs(x2 - x1));
            line.setAttribute("y1", y1 < y2 ? 0 : Math.abs(y2 - y1));
            line.setAttribute("x2", x1 < x2 ? Math.abs(x2 - x1) : 0);
            line.setAttribute("y2", y1 < y2 ? Math.abs(y2 - y1) : 0);
            line.setAttribute("stroke", "#999");
            line.setAttribute("stroke-width", "2");

            svg.appendChild(line);
            workflowArea.appendChild(svg);
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