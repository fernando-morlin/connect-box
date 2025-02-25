// js/utils.js
// Utility function for creating elements
function createElement(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

export { createElement }; // <--- This line is CRUCIAL