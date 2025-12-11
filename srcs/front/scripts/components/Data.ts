let globalPath = "/assets/emoticons/";
let animationPath = "/assets/animated/";

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