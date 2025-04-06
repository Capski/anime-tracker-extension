// MyAnimeList API constants
const MAL_CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your MAL API client ID
const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const MAL_API_URL = 'https://api.myanimelist.net/v2';
const REDIRECT_URL = chrome.identity.getRedirectURL();

// Current detected anime
let currentDetectedAnime = null;

// Track active tab for anime detection
let activeTabId = null;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('Anime Tracker Extension installed');
  
  // Set default settings
  chrome.storage.local.get('autoUpdate', function(result) {
    if (result.autoUpdate === undefined) {
      chrome.storage.local.set({autoUpdate: true});
    }
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case 'authenticate':
      authenticateMAL().then(result => {
        if (result && result.username) {
          chrome.runtime.sendMessage({
            action: 'authenticated',
            username: result.username
          });
        }
      });
      break;
      
    case 'logout':
      currentDetectedAnime = null;
      break;
      
    case 'getDetectedAnime':
      sendResponse({anime: currentDetectedAnime});
      break;
      
    case 'animeDetected':
      handleAnimeDetection(message.anime);
      break;
      
    case 'updateMal':
      updateMyAnimeList(currentDetectedAnime).then(result => {
        sendResponse(result);
      });
      return true; // Required for async response
  }
});

// Track active tab changes
chrome.tabs.onActivated.addListener(activeInfo => {
  activeTabId = activeInfo.tabId;
});

// Listen for URL changes in tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && supportedSite(tab.url)) {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      files: ['content.js']
    });
  }
});

// Check if URL is a supported streaming site
function supportedSite(url) {
  if (!url) return false;
  return url.includes('crunchyroll.com') || 
         url.includes('netflix.com') || 
         url.includes('anicrush.com');
}

// Authenticate with MyAnimeList
async function authenticateMAL() {
  // Build the auth URL with required parameters
  const authUrl = new URL(MAL_AUTH_URL);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', MAL_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URL);
  authUrl.searchParams.append('code_challenge', generateRandomString(64));
  authUrl.searchParams.append('code_challenge_method', 'plain');

  try {
    // Launch the auth flow
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    });
    
    // Extract authorization code from response URL
    const url = new URL(responseUrl);
    const code = url.searchParams.get('code');
    
    if (code) {
      // Exchange code for access token (implementation omitted for MVP)
      // In a complete implementation, you would make a request to MAL's token endpoint
      const token = 'sample-token'; // Placeholder
      
      // Get user info
      const username = await getUserInfo(token);
      
      // Save token and username
      chrome.storage.local.set({
        token: token,
        username: username
      });
      
      return { success: true, username: username };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: error.message };
  }
}

// Get user info from MyAnimeList
async function getUserInfo(token) {
  // In a real implementation, you would make an API request
  // For MVP, we'll return a placeholder username
  return 'MAL_User';
}

// Handle anime detection from content script
function handleAnimeDetection(anime) {
  console.log('Anime detected:', anime);
  currentDetectedAnime = anime;
  
  // Notify popup if open
  chrome.runtime.sendMessage({
    action: 'animeDetected',
    anime: anime
  });
  
  // Check if auto-update is enabled
  chrome.storage.local.get(['autoUpdate', 'token'], function(result) {
    if (result.autoUpdate && result.token) {
      updateMyAnimeList(anime);
    }
  });
}

// Update MyAnimeList with detected anime
async function updateMyAnimeList(anime) {
  if (!anime) {
    return { success: false, error: 'No anime detected' };
  }
  
  try {
    const token = await getStoredToken();
    
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // 1. Search for the anime by title
    const animeId = await searchAnime(anime.title, token);
    
    if (!animeId) {
      return { success: false, error: 'Anime not found on MyAnimeList' };
    }
    
    // 2. Update the user's anime list
    const status = anime.completed ? 'completed' : 'watching';
    const success = await updateAnimeStatus(animeId, {
      status: status,
      num_episodes_watched: anime.episode
    }, token);
    
    return { success: success };
  } catch (error) {
    console.error('Error updating MAL:', error);
    return { success: false, error: error.message };
  }
}

// Get stored token from chrome.storage
async function getStoredToken() {
  return new Promise(resolve => {
    chrome.storage.local.get('token', function(result) {
      resolve(result.token || null);
    });
  });
}

// Search for anime by title
async function searchAnime(title, token) {
  // In a complete implementation, you would make a request to:
  // GET /anime?q={title}&limit=1
  console.log(`Searching for anime: ${title}`);
  
  // For MVP, return a placeholder ID
  return 1234; // Placeholder anime ID
}

// Update user's anime status
async function updateAnimeStatus(animeId, updates, token) {
  // In a complete implementation, you would make a request to:
  // PATCH /anime/{anime_id}/my_list_status
  console.log(`Updating anime ${animeId} with status: ${updates.status}, episode: ${updates.num_episodes_watched}`);
  
  // For MVP, just return success
  return true;
}

// Helper function to generate random string for auth
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
}