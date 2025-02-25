# TextWeaver Connect

TextWeaver Connect is a visual workflow builder for interacting with Large Language Models (LLMs). It allows you to create and connect text blocks and instruction blocks, forming a workflow that processes text through LLMs. The application supports Google Gemini and OpenRouter as API providers.

## Features

*   **Visual Workflow Building:** Create workflows by dragging and connecting blocks.
*   **Text Blocks:** Input and display text.
*   **Instruction Blocks:** Process text using LLMs.
*   **Connections:** Connect blocks to define the flow of data.
*   **Execution:** Run the entire workflow or start execution from a specific instruction block.
*   **Settings:** Configure API provider (Gemini or OpenRouter), API keys, and models.
*   **Cycle Detection:** Prevents creating workflows with cyclic connections.
*   **Responsive Design:** Works on both desktop and mobile devices.
*   **Local Storage:** Saves settings (API keys, models) in the browser's local storage.
*   **Error Handling:** Displays error messages for API call failures and invalid workflow configurations.
* **Run from block:** Each instruction block has a "play" button to initiate execution from that point, useful for testing parts of a workflow.

## Project Structure

The project is organized into several files for better maintainability:

*   **`index.html`:**  The main HTML file.
*   **`css/styles.css`:**  Contains all the CSS styles.
*   **`js/`:**  Contains the JavaScript code, split into modules:
    *   `main.js`: The main application logic, event listeners, and initialization.
    *   `utils.js`: Utility functions (e.g., `createElement`).
    *   `block-creation.js`: Logic for creating new blocks.
    *   `block-dragging.js`: Handles block dragging and connection creation/validation during drag.
    *   `block-connection.js`: Manages persistent connections between blocks, updates visual connections, and handles block deletion.
    *   `settings-handler.js`: Manages the settings modal and saves/loads settings.
    *   `api-calls.js`: Contains functions for making API calls to Gemini and OpenRouter.
    *   `execution.js`: Handles the execution of the workflow, including traversing the graph and processing blocks.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    ```

2.  **Open `index.html` in your browser.** No server is required; the application runs entirely client-side.

3.  **Configure Settings:**
    *   Click the "Settings" button (gear icon) in the sidebar.
    *   Choose your API provider (Gemini or OpenRouter).
    *   Enter your API key.  **Important:**  Your API key is stored *locally* in your browser's storage and is *never* sent anywhere except directly to the selected API provider.
    *   Select the desired model.
    *   Click "Save".

4.  **Build Your Workflow:**
    *   Click the "Add Text Block" or "Add Instruction Block" buttons to create blocks.
    *   Drag blocks to reposition them.
    *   Drag from the output handle (right side) of one block to the input handle (left side) of another to create a connection.
    *   Enter text into text blocks and instructions into instruction blocks.

5.  **Execute Your Workflow:**
    *   Click the "Execute" button (play icon) in the sidebar to run the entire workflow.
    *   Click the "play" button on an individual instruction block to run the workflow *from that block*.

6.  **View Results:**
    *   The output of the workflow will be displayed in the "Execution Results" area below the workflow area.

## Dependencies

This project has no external dependencies. It uses vanilla JavaScript, HTML, and CSS.

## API Providers

*   **Google Gemini:**  Requires a Gemini API key.  You can obtain one from the Google AI Studio.
*   **OpenRouter:** Requires an OpenRouter API key. You can obtain one from the OpenRouter website.

## Important Considerations

*   **API Keys:** Your API keys are stored locally in your browser's `localStorage`.  This means they are *not* secure against determined attackers who have access to your computer.  However, they are not transmitted over the network except to the API provider you select.
*   **Error Handling:** The application includes basic error handling for API call failures and invalid workflow configurations (e.g., cycles).  More comprehensive error handling could be added.
*   **Rate Limiting:**  Be aware of the rate limits and usage quotas of the API providers you use.

## Future Enhancements

*   **More Block Types:**  Add support for different types of blocks (e.g., branching logic, data transformation).
*   **Improved Connection Handling:** Implement more sophisticated connection routing and visualization.
*   **Workflow Saving/Loading:** Allow users to save and load entire workflows.
*   **Undo/Redo:** Implement undo/redo functionality.
*   **More API Integrations:** Add support for other LLM providers.
*   **Export Results:** Provide options to export the execution results in different formats (e.g., text, JSON).

## Contributing

Contributions are welcome!  Please feel free to submit pull requests or open issues.