export interface MessageObject{
    id: string;
    playerID: string;
    accountID: string;
    author: string;
    subject: string;
    content?: string;
    date: string;
    unread?: boolean;
    browserColor: boolean;
}