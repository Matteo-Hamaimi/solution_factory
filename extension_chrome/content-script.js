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

// Exemple d'utilisation
const url = 'https://www.hephaistos-srh.fr/';
fetchPageContent(url)
  .then((content) => {
    if (content) {
      // Faites quelque chose avec le contenu récupéré, par exemple l'afficher dans la console
      console.log('Contenu de la page :', content);
    }
  });
