// js/theme-switcher.js

document.addEventListener('DOMContentLoaded', () => {
    // Get theme toggle button
    const themeToggleBtn = document.querySelector('.theme-toggle');
    
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('textweaver-theme');
    
    // Apply saved theme if it exists
    if (savedTheme === 'engineering') {
        document.body.classList.add('engineering-theme');
        updateToggleButtonTitle(true);
    }
    
    // Add click event listener to theme toggle button
    themeToggleBtn.addEventListener('click', () => {
        // Toggle the engineering theme class
        const isEngineeringTheme = document.body.classList.toggle('engineering-theme');
        
        // Save preference to localStorage
        localStorage.setItem('textweaver-theme', isEngineeringTheme ? 'engineering' : 'gameish');
        
        // Update button title for accessibility
        updateToggleButtonTitle(isEngineeringTheme);
    });
    
    function updateToggleButtonTitle(isEngineeringTheme) {
        const themeToggleBtn = document.querySelector('.theme-toggle');
        themeToggleBtn.title = isEngineeringTheme 
            ? 'Switch to Gameish Theme' 
            : 'Switch to Engineering Theme';
    }
});