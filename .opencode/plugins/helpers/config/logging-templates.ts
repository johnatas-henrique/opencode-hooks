// Logging Templates - Future feature for saveToFile customization
// This file will contain template configurations for file logging
//
// Currently saveToFile just appends raw data. Future enhancement will allow:
// - Custom templates with placeholders
// - File rotation
// - Max file size limits
// - Different formats (JSON, CSV, plain text)

// Future interface example:
//
// export interface LoggingTemplate {
//   path: string;           // Supports {date}, {timestamp}, {eventType}
//   format: 'json' | 'text';
//   template?: string;     // Custom message template
//   maxSize?: string;      // e.g., '10MB'
//   rotate?: boolean;     // Enable rotation
//   maxFiles?: number;    // Number of files to keep
// }
//
// export const templates: Record<string, LoggingTemplate> = {
//   sessionLog: {
//     path: 'production/session-logs/{date}.log',
//     format: 'text',
//     template: '[{timestamp}] {eventType}: {message}',
//     maxSize: '10MB',
//     rotate: true,
//   },
// };

export {};
