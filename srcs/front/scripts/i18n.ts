/* translations */
import i18next from "i18next";
import fr from "../locales/fr.json";
import en from "../locales/en.json";
import es from "../locales/es.json";


export async function initI18n() {
	await i18next.init({
		lng: "en",
		fallbackLng: "en",
		debug: false,
		resources: {
			en: { translation: en },
			fr: { translation: fr },
			es: { translation: es }
		},
	});
}

export default i18next;