export const normalizeToUTC = (obj: any): void => {
    // Makes the date-normalization utility available for use throughout your application.
    if (!obj || typeof obj !== 'object') return;
    // A safety check that halts execution if the input is null or not a complex data structure.
    if (Array.isArray(obj)) {
    // Identifies if the data is a list, allowing the utility to iterate through each item.
        for (let i = 0; i < obj.length; i++) {
            const item = obj[i];
            if (item instanceof Date) {
                obj[i] = item.toISOString();
            } else if (typeof item === 'object' && item !== null) {
                normalizeToUTC(item);
            }
        }
        // Iterates through an array to convert Date objects to ISO strings or recurse into nested objects.
    } else {
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

            const val = obj[key];

            if (val instanceof Date) {
                obj[key] = val.toISOString();
            } else if (Array.isArray(val)) {
                normalizeToUTC(val); // recurse into array
            } else if (typeof val === 'object' && val !== null) {
                normalizeToUTC(val); // recurse into object
            }
        }
        // Iterates through object keys to find Date instances or nested structures for UTC normalization.
    }
};
