import { emoticons } from "./Data";

//================================================
//=============== PARSING MESSAGES ===============
//================================================

// To avoid injecting HTML
export const escapeHTML = (text: string): string => {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};


export const escapeRegex = (string: string): string => {
	return (string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
};


export const parseMessage = (message: string): string => {
	let formattedMessage = escapeHTML(message);
	const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);

	sortedKeys.forEach(key => {
		const imgUrl = emoticons[key];
		const escapedKey = escapeRegex(escapeHTML(key));
		const regex = new RegExp(escapedKey, "g");

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