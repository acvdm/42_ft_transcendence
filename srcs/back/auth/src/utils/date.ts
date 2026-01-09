// A revoir avec JWT

export function getExpirationDate(dayFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + dayFromNow);
    return date.toISOString(); // consvertir en ISO string pour SQLite
}

export function isExpired(expiresAt: string): boolean {
    const now = new Date();
    const expiry = new Date(expiresAt);

    if (isNaN(expiry.getTime())) {
        console.error('Inalid expiration date:', expiresAt);
        return true;
    }
    return now > expiry;
}