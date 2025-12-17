import { fetchWithAuth } from "../pages/api";
import SocketService from "../services/SocketService";

let globalPath = "/assets/emoticons/";
let animationPath = "/assets/animated/";

export interface Theme {
    name: string;
    headerUrl: string;
    navColor: string;
    bgColor: string;
}


export const appThemes: { [key: string]: Theme } = {
    'basic': {
        name: 'Classic Blue',
        headerUrl: '/assets/basic/background.jpg',
        navColor: 'linear-gradient(to bottom, #5DBFED 0%, #3CB1E8 50%, #3db6ec 50%, #3db6ec 100%)',
        bgColor: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #7ED5F4 100%)'
    },
    'bamboo': {
    name: 'Zen Bamboo',
    headerUrl: '/assets/headers/bamboo_header.jpg',
    navColor: 'linear-gradient(to bottom, #7CB342 0%, #558B2F 50%, #33691E 100%)',
    bgColor: 'linear-gradient(to bottom, #93CD17 0%, #ffffff 50%, #93CD17 100%)'
    },

    'cherry': {
        name: 'Cherry Blossom',
        headerUrl: '/assets/headers/blossoms_header.jpg',
        navColor: 'linear-gradient(to bottom, #F48FB1 0%, #EC407A 50%, #C2185B 100%)',
        bgColor: 'linear-gradient(to bottom, #FFBBB4 0%, #ffffff 50%, #FFBBB4 100%)'
    },

    'mountain': {
        name: 'Misty Mountains',
        headerUrl: '/assets/headers/dawn_header.png',
        navColor: 'linear-gradient(to bottom, #5C6BC0 0%, #3949AB 50%, #283593 100%)',
        bgColor: 'linear-gradient(to bottom, #6F94BF 0%, #ffffff 50%, #6F94BF 100%)'
    },

    'punk': {
        name: 'Cyber Punk',
        headerUrl: '/assets/headers/punk_header.jpg',
        navColor: 'linear-gradient(to bottom, #340547 0%, #631C6E 50%, #340547 100%)',
        bgColor: 'linear-gradient(to bottom, #7B51B3 0%, #d8b4fe 50%, #7B51B3 100%)'
    },

    'dotted': {
        name: 'Spring Dots',
        headerUrl: '/assets/headers/dott_header.png',
        navColor: 'linear-gradient(to bottom, #9CCC65 0%, #7CB342 50%, #558B2F 100%)',
        bgColor: 'linear-gradient(to bottom, #8BC72C 0%, #ffffff 50%, #8BC72C 100%)'
    },

    'sunset': {
        name: 'Golden Sunset',
        headerUrl: '/assets/headers/field_header.png',
        navColor: 'linear-gradient(to bottom, #FF9800 0%, #F57C00 50%, #E65100 100%)',
        bgColor: 'linear-gradient(to bottom, #F7A624 0%, #ffffff 50%, #F7A624 100%)'
    },

    'football': {
        name: 'Stadium',
        headerUrl: '/assets/headers/football_header.png',
        navColor: 'linear-gradient(to bottom, #66BB6A 0%, #43A047 50%, #2E7D32 100%)',
        bgColor: 'linear-gradient(to bottom, #73AD4E 0%, #ffffff 50%, #73AD4E 100%)'
    },

    'spring': {
        name: 'Spring Garden',
        headerUrl: '/assets/headers/hill_header.png',
        navColor: 'linear-gradient(to bottom, #B7E51E 0%, #91D42F 50%, #80C432 100%)',
        bgColor: 'linear-gradient(to bottom, #73D4E5 0%, #ffffff 50%, #73D4E5 100%)'
    },

    'love': {
        name: 'Lovely Heart',
        headerUrl: '/assets/headers/love_header.jpg',
        navColor: 'linear-gradient(to bottom, #973D3D 0%, #7E2223 50%, #5A0908 100%)',
        bgColor: 'linear-gradient(to bottom, #832525 0%, #ffffff 50%, #832525 100%)'
    },
    'diary': {
        name: 'Dear Diary',
        headerUrl: '/assets/headers/diary_header.jpg',
        navColor: 'linear-gradient(to bottom, #D658A4 0%, #BA3083 50%, #D90082 100%)',
        bgColor: 'linear-gradient(to bottom, #E297B6 0%, #ffffff 50%, #E297B6 100%)'
    },

    'branches': {
        name: 'Winter Branches',
        headerUrl: '/assets/headers/silhouette_header.jpg',
        navColor: 'linear-gradient(to bottom, #FF9800 0%, #F57C00 50%, #E65100 100%)',
        bgColor: 'linear-gradient(to bottom, #F79B34 0%, #ffffff 50%, #F79B34 100%)'
    },

    'purple': {
        name: 'Purple Dreams',
        headerUrl: '/assets/headers/spring_header.png',
        navColor: 'linear-gradient(to bottom, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)',
        bgColor: 'linear-gradient(to bottom, #663A92 0%, #ffffff 50%, #663A92 100%)'
    },

    'abstract': {
        name: 'Abstract Flow',
        headerUrl: '/assets/headers/weird_header.jpg',
        navColor: 'linear-gradient(to bottom, #FF6B9D 0%, #FF1744 50%, #D50000 100%)',
        bgColor: 'linear-gradient(to bottom, #F38AB3 0%, #ffcdd2 50%, #F38AB3 100%)'
    }
};

export const ballEmoticons: { [key: string]: string } = {
    "smile": globalPath + "smile.gif",
    "surprised": globalPath + "surprised.gif",
    "wink": globalPath + "wink_smile.gif",
    "confused": globalPath + "confused.gif",
    "crying": globalPath + "crying.gif",
    "hot": globalPath + "hot.gif",
    "angel": globalPath + "angel.gif",
    "teeth_smile": globalPath + "teeth_smile.gif",
    "tongue": globalPath + "tongue_smile.gif",
    "sad": globalPath + "sad.gif",
    "disappointed": globalPath + "disappointed.gif",
    "embarrassed": globalPath + "embarrassed.gif",
    "angry": globalPath + "angry.gif",
    "nerd": globalPath + "nerd.gif",
    "sleepy": globalPath + "sleepy.gif",
    "teeth": globalPath + "teeth.gif",
    "sarcastic": globalPath + "sarcastic.gif",
    "sick": globalPath + "sick.gif",
    "thinking": globalPath + "thinking.gif",
    "eye_roll": globalPath + "eye_roll.gif",
    "devil": globalPath + "devil_smile.gif",
};


export const gameBackgrounds: { [key: string]: string } = {
    "classic": "#E8F4F8",      // Bleu pastel clair
    "mint": "#D4F1E8",         // Vert menthe
    "lavender": "#E6E6FA",     // Lavande
    "peach": "#FFE5D9",        // Pêche
    "rose": "#FFE1E9",         // Rose
    "lemon": "#FFFACD",        // Citron
    "sky": "#B0E0E6",          // Bleu ciel
    "coral": "#FFCCCB",        // Corail
    "lilac": "#DCD0FF",        // Lilas
    "sage": "#C8E6C9",         // Vert sauge
    "cream": "#FFF8DC",        // Crème
    "powder": "#B0C4DE",       // Bleu poudré
    "blush": "#FFC0CB",        // Rose poudré
    "seafoam": "#B2DFDB",      // Vert d'eau
    "apricot": "#FFDAB9",      // Abricot
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
    'available': '(Available)',
    'busy':      '(Busy)',
    'away':      '(Away)',
    'invisible': '(Appear offline)'
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

// On évite les doublons en créant des alias
function alias(keys: string[], file: string) {
    keys.forEach(k => emoticons[k] = globalPath + file);
}

// émoticones uniques
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

// alias = tous les doublons
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
        await fetchWithAuth(`/api/users/${userId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        // notifications aux amis
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