export type SlideData = {
    page: number;
    title: string;
    bullets: string[];
    images: {
        base64: string;
        width: number;
        height: number;
    }[];
}