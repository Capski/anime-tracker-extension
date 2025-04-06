document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const loginSection = document.getElementById('login-section');
  const userSection = document.getElementById('user-section');
  const usernameElement = document.getElementById('username');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const statusMessage = document.getElementById('status-message');
  const currentAnimeSection = document.getElementById('current-anime');
  const animeTitle = document.getElementById('anime-title');
  const animeEpisode = document.getElementById('anime-episode');
  const updateMalBtn = document.getElementById('update-mal-btn');
  const autoUpdateCheckbox = document.getElementById('auto-update');
  
  // Check if user is already authenticated
  chrome.storage.local.get(['token', 'username'], function(result) {
    if (result.token && result.username) {
      // User is logged in
      showUserSection(result.username);
    } else {
      // User is not logged in
      showLoginSection();
    }
  });
  
  // Get current anime detection status
  chrome.runtime.sendMessage({action: 'getDetectedAnime'}, function(response) {
    if (response && response.anime) {
      showDetectedAnime(response.anime);
    }
  });
  
  // Login button click handler
  loginBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'authenticate'});
  });
  
  // Logout button click handler
  logoutBtn.addEventListener('click', function() {
    chrome.storage.local.remove(['token', 'username'], function() {
      showLoginSection();
      chrome.runtime.sendMessage({action: 'logout'});
    });
  });
  
  // Update MAL button click handler
  updateMalBtn.addEventListener('click', function() {
    statusMessage.textContent = 'Updating MyAnimeList...';
    chrome.runtime.sendMessage({action: 'updateMal'}, function(response) {
      if (response.success) {
        statusMessage.textContent = 'Updated successfully!';
      } else {
        statusMessage.textContent = 'Update failed: ' + response.error;
      }
    });
  });
  
  // Auto-update setting change handler
  autoUpdateCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({autoUpdate: this.checked});
  });
  
  // Load auto-update setting
  chrome.storage.local.get('autoUpdate', function(result) {
    autoUpdateCheckbox.checked = result.autoUpdate !== false; // Default to true
  });
  
  // Listen for anime detection messages from background script
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'animeDetected') {
      showDetectedAnime(message.anime);
    }
  });
  
  // Handle successful authentication callback
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'authenticated' && message.username) {
      showUserSection(message.username);
    }
  });
  
  // Helper functions
  function showLoginSection() {
    loginSection.style.display = 'block';
    userSection.style.display = 'none';
  }
  
  function showUserSection(username) {
    loginSection.style.display = 'none';
    userSection.style.display = 'block';
    usernameElement.textContent = username;
  }
  
  function showDetectedAnime(anime) {
    currentAnimeSection.style.display = 'block';
    animeTitle.textContent = anime.title;
    animeEpisode.textContent = 'Episode ' + anime.episode;
    statusMessage.textContent = 'Anime detected';
  }
});