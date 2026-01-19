import { Database } from 'sqlite';
import { ServiceUnavailableError } from '../utils/error.js';

export interface Channel {
	id: number,
	channel_key: string
}

export async function findChannelByKey (
	db: Database,
	channelKey: string
): Promise <Channel | undefined>	
{
	const channel = await db.get(`
		SELECT * FROM CHANNELS WHERE channel_key = ?`,
		[channelKey]
	);

	if (!channel?.id)
	{
		console.log('Channel does not exist');
		return ;
	}
	
	return channel;
}

export async function createChannel (
	db: Database,
	channelKey: string
): Promise<number | undefined> 
{
	const result = await db.run(`
		INSERT INTO CHANNELS (channel_key)
		VALUES (?)`,
		[channelKey]
	);

	if (!result.lastID)
		throw new ServiceUnavailableError('Failed to create new channel');

	return result.lastID;
}

