// js/execution/execution-ui-updates.js

// Helper function to update the execution status message
function updateExecutionStatus(message, executionResultsDiv) {
    const statusElement = executionResultsDiv.querySelector('.execution-status');
    if (statusElement) {
        statusElement.innerHTML = `${message} <div class="spinner"></div>`;
    } else {
        executionResultsDiv.innerHTML = `<div class="execution-status">${message} <div class="spinner"></div></div>` + executionResultsDiv.innerHTML;
    }
}

// Function to reset UI elements after execution
function resetUI(executeBtn) {
    executeBtn.classList.remove('executing');
    document.querySelectorAll('.block.executing').forEach(block => {
        block.classList.remove('executing');
    });
}

export { updateExecutionStatus, resetUI };