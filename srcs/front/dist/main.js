"use strict";
// Message à afficher dans la console du navigateur
console.log("TypeScript est prêt et fonctionnel.");
// Sélectionne la div app de l'index.html
const appElement = document.getElementById('app');
// Test l'interaction avec le DOM
if (appElement)
    appElement.innerHTML += '<h2 class="text-green-500 p-4">Test TypeScript: Injecté avec succès! </h2>';
