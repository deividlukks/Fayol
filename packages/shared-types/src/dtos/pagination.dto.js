'use strict';
// ===========================
// Offset-based Pagination (Legacy)
// ===========================
Object.defineProperty(exports, '__esModule', { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
// ===========================
// Pagination Helpers
// ===========================
/**
 * Helper to build cursor from record ID
 */
function encodeCursor(id) {
  return Buffer.from(id).toString('base64');
}
/**
 * Helper to extract ID from cursor
 */
function decodeCursor(cursor) {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}
//# sourceMappingURL=pagination.dto.js.map
