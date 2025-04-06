// Content script that runs on supported streaming sites to detect anime

// Run detection when page loads and on interval
let currentAnime = null;
detectAnime();
setInterval(detectAnime, 5000); // Check every 5 seconds for changes

// Main detection function
function detectAnime() {
  const host = window.location.hostname;
  let detectedAnime = null;
  
  // Different detection logic based on the streaming site
  if (host.includes('crunchyroll.com')) {
    detectedAnime = detectCrunchyrollAnime();
  } else if (host.includes('netflix.com')) {
    detectedAnime = detectNetflixAnime();
  } else if (host.includes('anicrush.com')) {
    detectedAnime = detectAnicrushAnime();
  }
  
  // If we detected something and it's different from previous detection
  if (detectedAnime && (!currentAnime || 
      currentAnime.title !== detectedAnime.title || 
      currentAnime.episode !== detectedAnime.episode)) {
    
    currentAnime = detectedAnime;
    
    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'animeDetected',
      anime: detectedAnime
    });
  }
}

// Detect anime on Crunchyroll
function detectCrunchyrollAnime() {
  try {
    // Get title from page elements
    let title = '';
    const titleElement = document.querySelector('h1.title, .show-title-header');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Get episode number
    let episode = 0;
    let episodeText = '';
    
    // Look for episode info in different Crunchyroll page elements
    const episodeElement = document.querySelector('.episode-num, .episode-number, [data-t="episode-title"]');
    if (episodeElement) {
      episodeText = episodeElement.textContent.trim();
      
      // Extract numeric episode number
      const episodeMatch = episodeText.match(/Episode\s+(\d+)/i) || 
                          episodeText.match(/E(\d+)/i) ||
                          episodeText.match(/Ep\s*(\d+)/i);
      
      if (episodeMatch && episodeMatch[1]) {
        episode = parseInt(episodeMatch[1], 10);
      }
    }
    
    // If we have at least a title
    if (title) {
      // Check if episode ended
      const completed = isVideoEnded();
      
      return {
        source: 'crunchyroll',
        title: title,
        episode: episode,
        completed: completed,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error detecting Crunchyroll anime:', error);
  }
  
  return null;
}

// Detect anime on Netflix
function detectNetflixAnime() {
  try {
    // Get title from Netflix video player
    let title = '';
    const titleElement = document.querySelector('.video-title h4, .video-title span, .title-title');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Get episode info
    let episode = 0;
    const episodeElement = document.querySelector('.video-title p, .episode-title');
    if (episodeElement) {
      const episodeText = episodeElement.textContent.trim();
      
      // Extract numeric episode number
      const episodeMatch = episodeText.match(/Episode\s+(\d+)/i) || 
                          episodeText.match(/E(\d+)/i) ||
                          episodeText.match(/Ep\s*(\d+)/i);
      
      if (episodeMatch && episodeMatch[1]) {
        episode = parseInt(episodeMatch[1], 10);
      }
    }
    
    // If we have at least a title
    if (title) {
      // Check if it's actually anime (simplistic check for MVP)
      if (isAnimeTitle(title)) {
        // Check if episode ended
        const completed = isVideoEnded();
        
        return {
          source: 'netflix',
          title: title,
          episode: episode || 1, // Default to 1 if episode number not found
          completed: completed,
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('Error detecting Netflix anime:', error);
  }
  
  return null;
}

// Detect anime on Anicrush
function detectAnicrushAnime() {
  try {
    // Get title and episode from URL or page elements
    // Placeholder logic - would need to be customized based on actual Anicrush site structure
    let title = '';
    let episode = 0;
    
    // Example: try to get title from page title
    const pageTitle = document.title;
    if (pageTitle) {
      // Extract title and episode using regex (adjust based on actual format)
      const match = pageTitle.match(/(.+)\s+Episode\s+(\d+)/i);
      if (match) {
        title = match[1].trim();
        episode = parseInt(match[2], 10);
      }
    }
    
    // If we have at least a title
    if (title) {
      // Check if episode ended
      const completed = isVideoEnded();
      
      return {
        source: 'anicrush',
        title: title,
        episode: episode,
        completed: completed,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error detecting Anicrush anime:', error);
  }
  
  return null;
}

// Helper function to check if a video has ended
function isVideoEnded() {
  const videoElements = document.querySelectorAll('video');
  for (const video of videoElements) {
    if (video.currentTime > 0 && 
        video.currentTime >= video.duration * 0.9) {
      return true;
    }
  }
  return false;
}

// Simple heuristic to guess if a title is anime
// This is just a basic implementation - would need improvement
function isAnimeTitle(title) {
  // Check for common anime terms or patterns
  const animeKeywords = [
    'anime', 'manga', 'ninja', 'shinobi', 'sensei', 'senpai', 'chan', 'kun', 'san',
    'demon', 'slayer', 'naruto', 'one piece', 'dragon', 'attack on titan', 'hunter',
    'my hero', 'jojo', 'gundam', 'sailor', 'evangelion', 'sword art'
  ];
  
  const lowerTitle = title.toLowerCase();
  
  // Check for Japanese-style title patterns (ends with common suffixes)
  const japaneseSuffixes = ['-san', '-chan', '-kun', '-sama', '-dono', '-sensei'];
  
  // Check if title contains any anime keywords
  for (const keyword of animeKeywords) {
    if (lowerTitle.includes(keyword)) {
      return true;
    }
  }
  
  // Check for Japanese-style title patterns
  for (const suffix of japaneseSuffixes) {
    if (lowerTitle.endsWith(suffix)) {
      return true;
    }
  }
  
  // More sophisticated detection would need a database lookup
  return false;
}