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