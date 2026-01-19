/* translations */
import i18next from "i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";


export async function initI18n() {

	const savedLang = localStorage.getItem('userLanguage') || 'en';

	await i18next.init({
		lng: savedLang,
		fallbackLng: "en",
		debug: true,
		resources: {
			en: { translation: en },
			fr: { translation: fr },
			es: { translation: es }
		},
	});
}

export async function changeLanguage(lang: string) {
	await i18next.changeLanguage(lang);
	localStorage.setItem('userLanguage', lang);
	console.log("Language changed to:", lang);
}


export default i18next;