/**
 * Safely parses any error object/string from the backend and returns a human-readable string.
 * This prevents the "Minified React error #31" by ensuring we never pass an object to React's rendering engine.
 */
export const parseError = (error: any, defaultMessage: string = "An unexpected error occurred."): string => {
	console.error("Parsing error:", error);

	// 1. If no response, handle network error or simple error
	if (!error.response) {
		return error.message || defaultMessage;
	}

	const errorData = error.response.data;

	// 2. Handle string data
	if (typeof errorData === 'string') {
		return errorData || defaultMessage;
	}

	// 3. Handle object data (ASP.NET ValidationProblemDetails/ProblemDetails)
	if (errorData && typeof errorData === 'object') {
		// Priority 1: Validation errors dictionary
		if (errorData.errors && typeof errorData.errors === 'object') {
			const messages: string[] = [];
			Object.values(errorData.errors).forEach((val: any) => {
				if (Array.isArray(val)) {
					messages.push(...val);
				} else if (typeof val === 'string') {
					messages.push(val);
				}
			});
			if (messages.length > 0) {
				return messages.join(", ");
			}
		}

		// Priority 2: Title field
		if (errorData.title && typeof errorData.title === 'string') {
			return errorData.title;
		}

		// Priority 3: Custom message fields often used in APIs
		if (errorData.message && typeof errorData.message === 'string') {
			return errorData.message;
		}
	}

	return defaultMessage;
};
