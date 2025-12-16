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
        "Paul"
    ];

    const adjectives =
    [
        "Charming",
        "Angry",
        "Cute",
        "Naugthy",
        "Bad",
        "Chatty",
        "Confident",
        "Dangerous",
        "Guilty",
        "Hungry",
        "Goofy",
        "Lazy",
        "Jealous"
    ];

    let randomAlias: string;
    let checkAlias: boolean;

    do 
    {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        randomAlias = `${animal} ${adjective}`;
        checkAlias = await isAliasUsed(db, randomAlias);
    } while (checkAlias);

    return randomAlias;
}