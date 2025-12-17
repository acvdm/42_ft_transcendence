import { isAliasUsed } from "../repositories/users.js"
import { Database } from 'sqlite';


export async function generateRandomAlias(
    db: Database
): Promise<string>
{
    const animals =
    [
        "Fox",
        "Bunny",
        "Deer",
        "Badger",
        "Squirrel",
        "Hawk",
        "Bear",
        "Tiger",
        "Monkey",
        "Panda",
        "Cat",
        "Koala",
        "Capybara",
        "Paul"
    ];

    const adjectives =
    [
        "Charming",
        "Angry",
        "Cute",
        "Naughty",
        "Bad",
        "Chatty",
        "Confident",
        "Dangerous",
        "Guilty",
        "Hungry",
        "Goofy",
        "Lazy",
        "Jealous",
    ];

    let randomAlias: string;
    let checkAlias: boolean;

    do 
    {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        randomAlias = `${adjective}${animal}`; // faustine: j'inverse les deux 
        checkAlias = await isAliasUsed(db, randomAlias);
    } while (checkAlias);

    return randomAlias;
}

export async function generateRandomAvatar(
    db: Database
): Promise<string>
{
    const avatars = 
    [
        "/assets/profile/Beach_Chairs.png",
        "/assets/profile/Chess_Pieces.png",
        "/assets/profile/Dirt_Bike.png",
        "/assets/profile/Friendly_Dog.png",
        "/assets/profile/Guest_(Windows_Vista).png",
        "/assets/profile/Orange_Daisy.png",
        "/assets/profile/Palm_Trees.png",
        "/assets/profile/Rocket_Launch.png",
        "/assets/profile/Rubber_Ducky.png",
        "/assets/profile/Running_Horses.png",
        "/assets/profile/Skateboarder.png",
        "/assets/profile/Soccer_Ball.png",
        "/assets/profile/User_(Windows_Vista).png",
        "/assets/profile/Usertile11_(Windows_Vista).png",
        "/assets/profile/Usertile3_(Windows_Vista).png",
        "/assets/profile/Usertile8_(Windows_Vista).png",
    ];

    let randomAvatar: string;

    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    randomAvatar = `${avatar}`;
    return randomAvatar;
}



                                