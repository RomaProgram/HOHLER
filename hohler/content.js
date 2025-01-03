(function() {
    let REPLACEMENT_TEXT = 'ХОХЛЫ';
    
    const EXCLUDED_TAGS = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 
      'CANVAS', 'SVG', 'META', 'LINK', 'HEAD', 'TITLE',
      'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 
      'VIDEO', 'AUDIO'
    ]);
  
    const processedNodes = new WeakSet();
  
    function replaceText(str) {
      if (!str || !str.trim()) return str;
      return str.replace(/\S+/g, REPLACEMENT_TEXT);
    }
  
    function isExcluded(node) {
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE && EXCLUDED_TAGS.has(node.tagName)) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    }
  
    function processTextNode(node) {
      if (processedNodes.has(node)) return;
      if (isExcluded(node.parentNode)) return;
      const oldVal = node.nodeValue;
      const newVal = replaceText(oldVal);
      if (oldVal !== newVal) {
        node.nodeValue = newVal;
      }
      processedNodes.add(node);
    }
  
    function traverseNodes(node) {
      if (processedNodes.has(node)) return;
  
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (isExcluded(node)) return;
        if (node.shadowRoot) {
          traverseNodes(node.shadowRoot);
        }
        node.childNodes.forEach(child => traverseNodes(child));
      }
      processedNodes.add(node);
    }
  
    function processDocument(root = document) {
      traverseNodes(root.body || root);
      if (root === document && document.title) {
        const oldTitle = document.title;
        const newTitle = replaceText(oldTitle);
        if (oldTitle !== newTitle) {
          document.title = newTitle;
        }
      }
    }
  
    function setupMutationObserver() {
      const observer = new MutationObserver(muts => {
        muts.forEach(m => {
          if (m.type === 'childList') {
            m.addedNodes.forEach(n => traverseNodes(n));
          } else if (m.type === 'characterData') {
            traverseNodes(m.target);
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  
    // Initialize only if "enabled" is true
    function init() {
      chrome.storage.local.get(['enabled'], (data) => {
        if (data.enabled === false) {
          return; // don't run if disabled
        }
        processDocument();
        setupMutationObserver();
      });
    }
  
    // Listen for "enable"/"disable" from background.js
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'enable') {
        // run the replacer
        processedNodes.clear(); // reset
        init();
      } else if (msg.action === 'disable') {
        // reload page so replaced text reverts back
        location.reload();
      }
    });
  
    // Run once DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  