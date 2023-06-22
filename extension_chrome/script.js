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

