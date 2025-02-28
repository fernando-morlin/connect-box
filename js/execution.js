// js/execution.js
// This file only exports the functions from workflow-traversal.js
import { executeWorkflow } from './execution/workflow-traversal.js';

// Export executeWorkflow and executeFromBlock
export { executeWorkflow, executeWorkflow as executeFromBlock };