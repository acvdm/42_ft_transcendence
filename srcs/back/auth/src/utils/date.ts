// A revoir avec JWT

export function getExpirationDate(dayFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + dayFromNow);
    return date;
}