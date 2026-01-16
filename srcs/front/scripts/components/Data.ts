import { fetchWithAuth } from "../services/api";
import SocketService from "../services/SocketService";
import i18next from "../i18n";

export class Data {
	static get hasUnreadMessage(): boolean {
		return localStorage.getItem('hasUnreadMessage') === 'true';
	}

	static set hasUnreadMessage(value: boolean) {
		localStorage.setItem('hasUnreadMessage', String(value));
	}
}

let globalPath = "/assets/emoticons/";
let animationPath = "/assets/animated/";
let gamePath = "/assets/game/";

export interface Theme {
	name: string;
	headerUrl: string;
	navColor: string;
	bgColor: string;
	textColor: string;
}


export const appThemes: { [key: string]: Theme } = {
	'basic': {
		get name() { return i18next.t('data.themes.basic', 'Classic Blue'); }, // Getter dynamique
		headerUrl: '/assets/basic/background.jpg',
		navColor: 'linear-gradient(to bottom, #5DBFED 0%, #3CB1E8 50%, #3db6ec 50%, #3db6ec 100%)',
		bgColor: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #7ED5F4 100%)',
		textColor: '#3E73B0'
	},
	'bamboo': {
		get name() { return i18next.t('data.themes.bamboo', 'Zen Bamboo'); },
		headerUrl: '/assets/headers/bamboo_header.jpg',
		navColor: 'linear-gradient(to bottom, #7CB342 0%, #558B2F 50%, #33691E 100%)',
		bgColor: 'linear-gradient(to bottom, #93CD17 0%, #ffffff 50%, #93CD17 100%)',
		textColor: '#33691E'
	},

	'cherry': {
		get name() { return i18next.t('data.themes.cherry', 'Cherry Blossom'); },
		headerUrl: '/assets/headers/blossoms_header.jpg',
		navColor: 'linear-gradient(to bottom, #F48FB1 0%, #EC407A 50%, #C2185B 100%)',
		bgColor: 'linear-gradient(to bottom, #FFBBB4 0%, #ffffff 50%, #FFBBB4 100%)',
		textColor: '#C2185B'
	},

	'mountain': {
		get name() { return i18next.t('data.themes.mountain', 'Misty Mountains'); },
		headerUrl: '/assets/headers/dawn_header.png',
		navColor: 'linear-gradient(to bottom, #5C6BC0 0%, #3949AB 50%, #283593 100%)',
		bgColor: 'linear-gradient(to bottom, #6F94BF 0%, #ffffff 50%, #6F94BF 100%)',
		textColor: '#283593'
	},

	'punk': {
		get name() { return i18next.t('data.themes.punk', 'Cyber Punk'); },
		headerUrl: '/assets/headers/punk_header.jpg',
		navColor: 'linear-gradient(to bottom, #340547 0%, #631C6E 50%, #340547 100%)',
		bgColor: 'linear-gradient(to bottom, #7B51B3 0%, #d8b4fe 50%, #7B51B3 100%)',
		textColor: '#631C6E'
	},

	'dotted': {
		get name() { return i18next.t('data.themes.dotted', 'Spring Dots'); },
		headerUrl: '/assets/headers/dott_header.png',
		navColor: 'linear-gradient(to bottom, #9CCC65 0%, #7CB342 50%, #558B2F 100%)',
		bgColor: 'linear-gradient(to bottom, #8BC72C 0%, #ffffff 50%, #8BC72C 100%)',
		textColor: '#558B2F'
	},

	'sunset': {
		get name() { return i18next.t('data.themes.sunset', 'Golden Sunset'); },
		headerUrl: '/assets/headers/field_header.png',
		navColor: 'linear-gradient(to bottom, #FF9800 0%, #F57C00 50%, #E65100 100%)',
		bgColor: 'linear-gradient(to bottom, #F7A624 0%, #ffffff 50%, #F7A624 100%)',
		textColor: '#E65100'
	},

	'football': {
		get name() { return i18next.t('data.themes.football', 'Stadium'); },
		headerUrl: '/assets/headers/football_header.png',
		navColor: 'linear-gradient(to bottom, #66BB6A 0%, #43A047 50%, #2E7D32 100%)',
		bgColor: 'linear-gradient(to bottom, #73AD4E 0%, #ffffff 50%, #73AD4E 100%)',
		textColor: '#2E7D32'
	},

	'spring': {
		get name() { return i18next.t('data.themes.spring', 'Spring Garden'); },
		headerUrl: '/assets/headers/hill_header.png',
		navColor: 'linear-gradient(to bottom, #B7E51E 0%, #91D42F 50%, #80C432 100%)',
		bgColor: 'linear-gradient(to bottom, #73D4E5 0%, #ffffff 50%, #73D4E5 100%)',
		textColor: '#6CB85A'
	},

	'love': {
		get name() { return i18next.t('data.themes.love', 'Lovely Heart'); },
		headerUrl: '/assets/headers/love_header.jpg',
		navColor: 'linear-gradient(to bottom, #973D3D 0%, #7E2223 50%, #5A0908 100%)',
		bgColor: 'linear-gradient(to bottom, #832525 0%, #ffffff 50%, #832525 100%)',
		textColor: '#7E2223'
	},
	'diary': {
		get name() { return i18next.t('data.themes.diary', 'Dear Diary'); },
		headerUrl: '/assets/headers/diary_header.jpg',
		navColor: 'linear-gradient(to bottom, #D658A4 0%, #BA3083 50%, #D90082 100%)',
		bgColor: 'linear-gradient(to bottom, #E297B6 0%, #ffffff 50%, #E297B6 100%)',
		textColor: '#D90082'
	},

	'branches': {
		get name() { return i18next.t('data.themes.branches', 'Winter Branches'); },
		headerUrl: '/assets/headers/silhouette_header.jpg',
		navColor: 'linear-gradient(to bottom, #FF9800 0%, #F57C00 50%, #E65100 100%)',
		bgColor: 'linear-gradient(to bottom, #F79B34 0%, #ffffff 50%, #F79B34 100%)',
		textColor: '#E65100'
	},

	'purple': {
		get name() { return i18next.t('data.themes.purple', 'Purple Dreams'); },
		headerUrl: '/assets/headers/spring_header.png',
		navColor: 'linear-gradient(to bottom, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)',
		bgColor: 'linear-gradient(to bottom, #663A92 0%, #ffffff 50%, #663A92 100%)',
		textColor: '#6A1B9A'
	},

	'abstract': {
		get name() { return i18next.t('data.themes.abstract', 'Abstract Flow'); },
		headerUrl: '/assets/headers/weird_header.jpg',
		navColor: 'linear-gradient(to bottom, #FF6B9D 0%, #FF1744 50%, #D50000 100%)',
		bgColor: 'linear-gradient(to bottom, #F38AB3 0%, #ffcdd2 50%, #F38AB3 100%)',
		textColor: '#D50000'
	}
};

export const ballEmoticons: { [key: string]: string } = {
	"smile": gamePath + "smile.png",
	"surprised": gamePath + "surprised.png",
	"confused": gamePath + "confused.png",
	"hot": gamePath + "hot.png",
	"crying": gamePath + "crying.png",
	"tongue": gamePath + "tongue_smile.png",
	"sad": gamePath + "sad.png",
	"disappointed": gamePath + "disappointed.png",
	"embarrassed": gamePath + "embarrassed.png",
	"angry": gamePath + "angry.png",
	"nerd": gamePath + "nerd.png",
	"teeth": gamePath + "teeth.png",
	"sarcastic": gamePath + "sarcastic.png",
	"sick": gamePath + "sick.png",
};

export const gameBackgrounds: { [key: string]: string } = {
	"classic": "#B8E8F9",
	"mint": "#D4F1E8",
	"lavender": "#E6E6FA",
	"rose": "#FFE1E9",
	"lemon": "#FFFACD",
	"sky": "#B0E0E6",
	"coral": "#FFCCCB",
	"lilac": "#DCD0FF",
	"sage": "#C8E6C9",
	"powder": "#B0C4DE",
	"blush": "#FFC0CB",
	"apricot": "#FFDAB9",
};


export const statusImages: { [key: string]: string } = {
	'available': '/assets/basic/status_online_small.png',
	'online': '/assets/basic/status_online_small.png',
	'busy':      '/assets/basic/status_busy_small.png',
	'away':      '/assets/basic/status_away_small.png',
	'invisible': '/assets/basic/status_offline_small.png',
	'offline':   '/assets/basic/status_offline_small.png'
};

export const statusLabels: { [key: string]: string } = {
	get 'available'() { return i18next.t('data.status.available', '(Available)'); },
	get 'busy'() { return i18next.t('data.status.busy', '(Busy)'); },
	get 'away'() { return i18next.t('data.status.away', '(Away)'); },
	get 'invisible'() { return i18next.t('data.status.invisible', '(Appear offline)'); }
};

export const getStatusDot = (status: string) => {
	switch(status) {
		case 'available':   return '/assets/friends/online-dot.png';
		case 'busy':        return '/assets/friends/busy-dot.png';
		case 'away':        return '/assets/friends/away-dot.png';
		default:            return '/assets/friends/offline-dot.png';
	}
};

export const animations: { [key: string]: string } = {
	"(boucy_ball)" : animationPath + "bouncy_ball.gif",
	"(bow)" : animationPath + "bow.gif",
	"(crying)" : animationPath + "crying.gif",
	"(dancer)" : animationPath + "dancer.gif",
	"(dancing_pig)" : animationPath + "dancing_pig.gif",
	"(frog)" : animationPath + "frog.gif",
	"(guitar_smash)" : animationPath + "guitar_smash.gif",
	"(heart)" : animationPath + "heart.gif",
	"(kiss)" : animationPath + "kiss.gif",
	"(knock)" : animationPath + "knock.gif",
	"(silly_face)" : animationPath + "silly_face.gif",
	"(ufo)" : animationPath + "ufo.gif",
	"(water_balloon)" : animationPath + "water_balloon.gif",
};

export const icons: { [key: string]: string } = {
	"(boucy_ball)" : animationPath + "bouncy_ball.png",
	"(bow)" : animationPath + "bow.jpg",
	"(crying)" : animationPath + "crying.png",
	"(dancer)" : animationPath + "dancer.png",
	"(dancing_pig)" : animationPath + "dancing_pig.png",
	"(frog)" : animationPath + "frog.png",
	"(guitar_smash)" : animationPath + "guitar_smash.png",
	"(heart)" : animationPath + "heart.png",
	"(kiss)" : animationPath + "kiss.png",
	"(knock)" : animationPath + "knock.png",
	"(silly_face)" : animationPath + "silly_face.png",
	"(ufo)" : animationPath + "ufo.png",
	"(water_balloon)" : animationPath + "water_balloon.png",
};

export const emoticons: { [key: string]: string } = {};

function alias(keys: string[], file: string) {
	keys.forEach(k => emoticons[k] = globalPath + file);
}

Object.assign(emoticons, {
	":-)" : globalPath + "smile.gif",
	":-O" : globalPath + "surprised.gif",
	";-)" : globalPath + "wink_smile.gif",
	":-S" : globalPath + "confused.gif",
	":'(" : globalPath + "crying.gif",
	":-#" : globalPath + "silence.gif",
	"8-|" : globalPath + "nerd.gif",
	":-*" : globalPath + "secret.gif",
	":^)" : globalPath + "unknow.gif",
	"|-)" : globalPath + "sleepy.gif",
	"({)" : globalPath + "guy_hug.gif",
	":-[" : globalPath + "bat.gif",
	"(@)" : globalPath + "cat.gif",
	"(8)" : globalPath + "note.gif",
	"(*)" : globalPath + "star.gif",
	"(sn)" : globalPath + "snail.gif",
	"(pl)" : globalPath + "plate.gif",
	"(pi)" : globalPath + "pizza.gif",
	"(au)" : globalPath + "car.gif",
	"(um)" : globalPath + "umbrella.gif",
	"(co)" : globalPath + "computer.gif",
	"(st)" : globalPath + "storm.gif",
	"(mo)" : globalPath + "money.gif",
	"8o|" : globalPath + "teeth.gif",
	"^o)" : globalPath + "sarcastic.gif",
	"+o(" : globalPath + "sick.gif",
	"*-)" : globalPath + "thinking.gif",
	"8-)" : globalPath + "eye_roll.gif",
	"(6)" : globalPath + "devil_smile.gif",
	"(bah)" : globalPath + "sheep.gif",
	"(||)" : globalPath + "bowl.gif",
	"(so)" : globalPath + "soccer.gif",
	"(ap)" : globalPath + "airplane.gif",
	"(ip)" : globalPath + "island.gif",
	"(mp)" : globalPath + "portable.gif",
	"(li)" : globalPath + "lightning.gif",
});

// To avoid duplicate
alias([":)", ":-)"], "smile.gif");
alias([":o", ":-O"], "surprised.gif");
alias([";)", ";-)"], "wink_smile.gif");
alias([":s", ":-S"], "confused.gif");
alias(["(H)", "(h)"], "hot.gif");
alias(["(A)", "(a)"], "angel.gif");
alias([":[" , ":-["], "bat.gif");
alias(["(L)", "(l)"], "heart.gif");
alias(["(K)", "(k)"], "kiss.gif");
alias(["(F)", "(f)"], "rose.gif");
alias(["(P)", "(p)"], "camera.gif");
alias(["(T)", "(t)"], "phone.gif");
alias(["(O)", "(o)"], "clock.gif");
alias([":D", ":-D"], "teeth_smile.gif");
alias([":p", ":-P"], "tongue_smile.gif");
alias([":(", ":-("], "sad.gif");
alias([":|", ":-|"], "disappointed.gif");
alias([":$", ":-$"], "embarrassed.gif");
alias([":@", ":-@"], "angry.gif");
alias(["(C)", "(c)"], "coffee.gif");
alias(["(N)", "(n)"], "thumbs_down.gif");
alias(["(D)", "(d)"], "martini.gif");
alias(["(Z)", "(z)"], "guy.gif");
alias(["(})", "({)"], "guy_hug.gif");
alias(["(U)", "(u)"], "broken_heart.gif");
alias(["(G)", "(g)"], "present.gif");
alias(["(W)", "(w)"], "wilted_rose.gif");
alias(["(E)", "(e)"], "email.gif");
alias(["(I)", "(i)"], "lightbulb.gif");
alias(["(M)", "(m)"], "messenger.gif");
alias(["(Y)", "(y)"], "thumbs_up.gif");
alias(["(B)", "(b)"], "beer_mug.gif");
alias(["(X)", "(x)"], "girl.gif");


export async function updateUserStatus(newStatus: string) {
	const userId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');

	if (!userId) return;

	try {
		await fetchWithAuth(`/api/user/${userId}/status`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});

		const socket = SocketService.getInstance().socket;
		if (socket && username) {
			socket.emit('notifyStatusChange', { 
				userId: Number(userId), 
				status: newStatus,
				username: username 
			});
			console.log(`[Status] Updated to ${newStatus} for ${username}`);
		}
		
		localStorage.setItem('userStatus', newStatus);

	} catch (error) {
		console.error("Failed to update status:", error);
	}
}