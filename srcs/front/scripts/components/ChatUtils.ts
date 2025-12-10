import { emoticons } from "./Data";

// ---------------------------------------------------
// ----           PARSING DES MESSAGES            ----
// ---------------------------------------------------

// pour éviter les inj3etions de code hgtml script
export const escapeHTML = (text: string): string => {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// utiliser les caracteres speciaux dans les regex (= ctrl+f)
export const escapeRegex = (string: string): string => {
    return (string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
};

// on prend le texte et on le transforme en url de l'image
export const parseMessage = (message: string): string => {
    // on securise le texte avec escape html
    let formattedMessage = escapeHTML(message);
    // on parcours la map des emoticons pour remplacer par celui qu'on veut 
    // on trie les cles par longueur pour evciter les conflits
    const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);

    sortedKeys.forEach(key => {
        const imgUrl = emoticons[key];
        // on cree une recherche dynamique pour trouver l'emoticone
        const escapedKey = escapeRegex(escapeHTML(key));
        const regex = new RegExp(escapedKey, "g");

        // on remplace par l'iamnge avec une classe tialwind pour aligner au texte
        formattedMessage = formattedMessage.replace(
            regex,
            `<img src="${imgUrl}" alt="${key}" class="inline-block w-[20px] h-[20px] align-middle mx-0.5" />`
        );
    });

    formattedMessage = formattedMessage
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
        .replace(/\[s\](.*?)\[\/s\]/g, '<s>$1</s>')
        .replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');


    return formattedMessage;
};