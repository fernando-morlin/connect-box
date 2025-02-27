// js/zoom-handler.js
import { updateConnections } from './block-connection.js';

// Initial zoom level (100%)
let zoomLevel = 1;
const zoomStep = 0.1; // 10% zoom step
const minZoom = 0.3; // 30% minimum zoom
const maxZoom = 3;   // 300% maximum zoom

// Track panning state
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

// Initialize zoom controls
function initializeZoom(workflowArea) {
    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    
    // Zoom in button
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-btn zoom-in';
    zoomInBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
    zoomInBtn.title = 'Zoom In';
    
    // Zoom display
    const zoomDisplay = document.createElement('span');
    zoomDisplay.className = 'zoom-level';
    zoomDisplay.textContent = '100%';
    zoomDisplay.title = 'Current Zoom Level';
    
    // Zoom out button
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-btn zoom-out';
    zoomOutBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
    zoomOutBtn.title = 'Zoom Out';
    
    // Assemble the controls
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomDisplay);
    zoomControls.appendChild(zoomInBtn);
    
    // Add controls to the workflow area
    document.body.appendChild(zoomControls); // Place at body level to remain fixed position
    
    // Add event listeners
    zoomInBtn.addEventListener('click', () => {
        zoomIn(workflowArea, zoomDisplay);
    });
    
    zoomOutBtn.addEventListener('click', () => {
        zoomOut(workflowArea, zoomDisplay);
    });
    
    // Add mouse wheel zoom support
    workflowArea.addEventListener('wheel', (e) => {
        // Only zoom if Ctrl key is pressed (standard zoom modifier)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn(workflowArea, zoomDisplay);
            } else {
                zoomOut(workflowArea, zoomDisplay);
            }
        }
    });
    
    // Add middle mouse button panning
    const workflowContent = workflowArea.querySelector('.workflow-content');
    
    workflowArea.addEventListener('mousedown', (e) => {
        // Check if it's middle mouse button (button 1)
        if (e.button === 1) {
            e.preventDefault();
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            workflowArea.style.cursor = 'grabbing';
        }
    });
    
    workflowArea.addEventListener('mousemove', (e) => {
        if (isPanning) {
            e.preventDefault();
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            
            // Apply the pan by scrolling the workflow area
            workflowArea.scrollLeft -= dx;
            workflowArea.scrollTop -= dy;
            
            // Update pan start position for next move
            panStartX = e.clientX;
            panStartY = e.clientY;
        }
    });
    
    // End panning on mouse up or mouse leave
    const endPan = () => {
        if (isPanning) {
            isPanning = false;
            workflowArea.style.cursor = 'default';
        }
    };
    
    workflowArea.addEventListener('mouseup', endPan);
    workflowArea.addEventListener('mouseleave', endPan);
}

// Zoom in function
function zoomIn(workflowArea, zoomDisplay) {
    if (zoomLevel < maxZoom) {
        zoomLevel += zoomStep;
        applyZoom(workflowArea, zoomDisplay);
    }
}

// Zoom out function
function zoomOut(workflowArea, zoomDisplay) {
    if (zoomLevel > minZoom) {
        zoomLevel -= zoomStep;
        applyZoom(workflowArea, zoomDisplay);
    }
}

// Apply zoom transformation
function applyZoom(workflowArea, zoomDisplay) {
    // Round to 2 decimal places for display
    const displayZoom = Math.round(zoomLevel * 100) + '%';
    zoomDisplay.textContent = displayZoom;
    
    // Apply scale transform to the workflow content container
    const workflowContent = workflowArea.querySelector('.workflow-content') || workflowArea;
    workflowContent.style.transform = `scale(${zoomLevel})`;
    workflowContent.style.transformOrigin = 'top left';
    
    // Update connections after zoom to ensure they're properly positioned
    updateConnections(workflowArea);
    
    // Store current zoom level in localStorage for persistence
    localStorage.setItem('workflow-zoom-level', zoomLevel);
}

// Load zoom level from localStorage
function loadSavedZoom(workflowArea) {
    const savedZoom = localStorage.getItem('workflow-zoom-level');
    if (savedZoom) {
        zoomLevel = parseFloat(savedZoom);
        const zoomDisplay = document.querySelector('.zoom-level');
        applyZoom(workflowArea, zoomDisplay);
    }
}

// Return current zoom level (useful for other modules)
function getCurrentZoom() {
    return zoomLevel;
}

export { initializeZoom, loadSavedZoom, getCurrentZoom };