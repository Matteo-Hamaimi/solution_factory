// Fonction principale pour extraire les commentaires Airbnb
function extractAirbnbComments() {
    // Sélectionnez tous les éléments avec la classe "ll4r2nl dir dir-ltr"
    const commentElements = document.querySelectorAll('.ll4r2nl.dir.dir-ltr');
    
    // Créez un tableau pour stocker les commentaires extraits
    const comments = [];
    
    // Parcourez les éléments et récupérez le texte des commentaires
    commentElements.forEach((commentElement) => {
      const commentText = commentElement.textContent;
      comments.push(commentText);
    });
    
    console.log('Comments:', comments); // Affiche les commentaires dans la console
    
    return comments;
  }
  
  // Fonction pour afficher les commentaires dans le popup.html
  function displayComments(comments) {
    const commentsContainer = document.getElementById('comments-container');
    
    // Parcourez les commentaires et créez un élément de paragraphe pour chaque commentaire
    comments.forEach((comment) => {
      const commentParagraph = document.createElement('p');
      commentParagraph.textContent = comment;
      commentsContainer.appendChild(commentParagraph);
    });
  }
  
  // Fonction principale qui sera appelée au chargement du popup.html
  function main() {
    // Extrait les commentaires Airbnb de la page
    const comments = extractAirbnbComments();
    
    // Affiche les commentaires dans le popup.html
    displayComments(comments);
  }
  
  // Appelle la fonction principale au chargement du popup.html
  document.addEventListener('DOMContentLoaded', main);
  