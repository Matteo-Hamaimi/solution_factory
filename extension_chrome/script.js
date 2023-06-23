function onWindowLoad() {
  var message = document.querySelector("#site-content > div > div:nth-child(1) > div:nth-child(4) > div > div > div > div:nth-child(2) > section > div:nth-child(3) > div > div > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > span > span")

  chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      var activeTab = tabs[0];
      var activeTabId = activeTab.id;

      return chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          // injectImmediately: true,  // uncomment this to make it execute straight away, other wise it will wait for document_idle
          func: DOMtoString,
          // args: ['body']  // you can use this to target what element to get the html for
      });

  }).then(function (results) {
      message.innerText = results[0].result;
  }).catch(function (error) {
      message.innerText = 'There was an error injecting script : \n' + error.message;
  });
}

window.onload = onWindowLoad;

function DOMtoString(selector) {
  if (selector) {
      selector = document.querySelector(selector);
      if (!selector) return "ERROR: querySelector failed to find node"
  } else {
      selector = document.documentElement;
  }
  return selector.outerHTML;
}



// Fonction principale pour extraire les commentaires Airbnb
function extractAirbnbComments() {
  const commentElements = document.querySelectorAll('.comment-list li p');
  const comments = [];
  
  commentElements.forEach((commentElement) => {
    const commentText = commentElement.textContent;
    comments.push(commentText);
  });
  
  console.log('Comments:', comments);
  
  return comments;
}

// Fonction pour extraire le teaser de la page https://www.hephaistos-srh.fr/
function extractTeaser() {
  const teaserElement = document.querySelector('.teaser');
  
  if (teaserElement) {
    const teaserHTML = teaserElement.innerHTML;
    console.log('Teaser HTML:', teaserHTML);
    return teaserHTML;
  } else {
    console.log('Teaser non trouvé.');
    return '';
  }
}

// Reste du code inchangé...


// Fonction pour afficher les commentaires dans le popup.html
function displayComments(comments) {
  const commentsContainer = document.getElementById('comments-container');
  
  comments.forEach((comment) => {
    const commentParagraph = document.createElement('p');
    commentParagraph.textContent = comment;
    commentsContainer.appendChild(commentParagraph);
  });
}

// Fonction pour afficher le teaser dans le popup.html
function displayTeaser(teaserHTML) {
  const teaserContainer = document.getElementById('teaser-container');
  teaserContainer.innerHTML = teaserHTML;
}

// Fonction principale qui sera appelée au chargement du popup.html
function main() {
  const comments = extractAirbnbComments();
  const teaserHTML = extractTeaser();
  
  displayComments(comments);
  displayTeaser(teaserHTML);
}

document.addEventListener('DOMContentLoaded', main);



// Fonction pour récupérer le contenu d'une page externe
async function fetchPageContent(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const content = await response.text();
      console.log('Contenu de la page :', content); // Affiche le contenu de la page dans la console
      return content;
    } else {
      console.error('Une erreur s\'est produite lors de la requête :', response.status);
      return null;
    }
  } catch (error) {
    console.error('Une erreur s\'est produite lors de la récupération du contenu de la page :', error);
    return null;
  }
}

// Exemple d'utilisation avec l'URL Airbnb
const url = 'https://www.airbnb.fr/rooms/35525760?adults=1&category_tag=Tag%3A677&children=0&enable_m3_private_room=true&infants=0&pets=0&search_mode=flex_destinations_search&check_in=2023-06-14&check_out=2023-06-21&source_impression_id=p3_1686745196_FugjCf9K3M%2F7HZ%2By&previous_page_section_name=1000&federated_search_id=db910383-b5e1-4c20-9c5f-20e46a5261a1';
fetchPageContent(url);

