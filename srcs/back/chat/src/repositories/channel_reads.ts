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

export async function getUnreadConversations(
    db: Database,
    userId: number
) {
    // On sélectionne simplement les infos du dernier message du groupe
    const query = `
        SELECT 
            c.channel_key,
            COUNT(m.msg_id) as unread_count,
            MAX(m.sent_at) as last_msg_date,
            
            -- Astuce SQL: On prend l'alias correspondant au message le plus récent
            (SELECT sender_alias FROM MESSAGES 
             WHERE channel_id = c.id AND sender_id != ? 
             ORDER BY sent_at DESC LIMIT 1) as sender_alias,

            (SELECT sender_id FROM MESSAGES 
             WHERE channel_id = c.id AND sender_id != ? 
             ORDER BY sent_at DESC LIMIT 1) as sender_id

        FROM MESSAGES m
        JOIN CHANNELS c ON m.channel_id = c.id
        LEFT JOIN CHANNEL_READS r ON m.channel_id = r.channel_id AND r.user_id = ?
        
        WHERE 
            m.sender_id != ? 
            -- IMPORTANT : On gère le cas où sent_at serait NULL (vieux messages)
            AND (r.last_read_at IS NULL OR COALESCE(m.sent_at, '0') > r.last_read_at)
            
        GROUP BY c.id, c.channel_key
    `;

    try {
        const rows = await db.all(query, [userId, userId, userId, userId]);
        console.log(`[DB] getUnreadConversations for user ${userId}: found ${rows.length} rows`);
        return rows || [];
    } catch (err) {
        console.error("[DB] Error in getUnreadConversations:", err);
        return [];
    }
}