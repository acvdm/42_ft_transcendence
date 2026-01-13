import { Database } from 'sqlite';
import { findChannelByKey } from './channels.js'

export async function updateLastRead (
    db: Database,
    channelKey: string,
    userId: number
)
{
    const channel = await findChannelByKey(db, channelKey);
    if (!channel?.id)
        return ;

    // UPDATE si la ligne channel_reads existe pour ce channel_user 
    // INSERT si ellle n'existe pas
    await db.run(`
        INSERT INTO CHANNEL_READS (channel_id, user_id, last_read_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(channel_id, user_id)
        DO UPDATE SET last_read_at = CURRENT_TIMESTAMP`,
        [channel.id, userId]
    );    
}

export async function hasUnreadMessages(
    db: Database,
    channelKey: string,
    userId: number
)
{
    const channel = await findChannelByKey(db, channelKey);
    if (!channel?.id)
        return ;
 
    // Avec un LEFT JOIN, la requête prend tous les messages et met
    // NULL dans les colonnes de CHANNEL_READS si pas de correspondance

    const result = await db.get(`
        SELECT COUNT(*) AS count
        FROM MESSAGES m
        LEFT JOIN CHANNEL_READS r ON m.channel_id = r.channel_id AND r.user_id = ?
        WHERE m.channel_id = ?
        AND m.sent_at > COALESCE(r.last_read_at, 0)`, // On compte les message arrivés après le dernier passage dans le channel
        [userId, channel.id]
    );

    return result.count > 0;
}