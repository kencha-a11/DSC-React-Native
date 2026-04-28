// utils/compressImage.ts
import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (uri: string, maxSizeKB: number = 2000) => {
    try {
        // Get image info
        const info = await ImageManipulator.manipulateAsync(uri, [], { compress: 1 });

        let compressedUri = uri;
        let compress = 0.8;
        let size = await getFileSize(uri);

        // Keep compressing until under maxSizeKB or we've tried too many times
        let attempts = 0;
        while (size > maxSizeKB * 1024 && attempts < 5 && compress > 0.2) {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1024 } }], // Resize to max width 1024px
                { compress, format: ImageManipulator.SaveFormat.JPEG }
            );
            compressedUri = result.uri;
            size = await getFileSize(compressedUri);
            compress -= 0.15; // Reduce quality further
            attempts++;
        }

        return compressedUri;
    } catch (error) {
        console.error('Error compressing image:', error);
        return uri;
    }
};

const getFileSize = async (uri: string): Promise<number> => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return blob.size;
    } catch (error) {
        console.error('Error getting file size:', error);
        return 0;
    }
};