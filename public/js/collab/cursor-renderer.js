/**
 * Cursor Renderer - Renders remote cursors and selections
 */

class CursorRenderer {
  constructor() {
    this.cursors = new Map();
    this.container = null;
    this.editorElement = null;
  }

  /**
   * Initialize renderer
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement} editor - Editor element
   */
  init(container, editor) {
    this.container = container;
    this.editorElement = editor;
    this.cursors.clear();
  }

  /**
   * Update remote cursor
   * @param {string} userId - User ID
   * @param {Object} user - User data
   * @param {Object} cursor - Cursor position
   */
  updateCursor(userId, user, cursor) {
    if (this.cursors.has(userId)) {
      this.removeCursor(userId);
    }

    const cursorElement = this.createCursorElement(userId, user);
    this.container.appendChild(cursorElement);
    this.cursors.set(userId, cursorElement);

    this.updateCursorPosition(cursorElement, cursor);
  }

  /**
   * Create cursor element
   * @param {string} userId - User ID
   * @param {Object} user - User data
   * @returns {HTMLElement} Cursor element
   */
  createCursorElement(userId, user) {
    const cursor = document.createElement("div");
    cursor.className = "remote-cursor";
    cursor.dataset.userId = userId;
    cursor.dataset.username = user.username || "Unknown";

    cursor.innerHTML = `
      <div class="remote-cursor-flag" style="background-color: ${user.color}">
        <span class="remote-cursor-label">${user.username}</span>
      </div>
    `;

    cursor.style.position = "absolute";
    cursor.style.zIndex = "1000";
    cursor.style.pointerEvents = "none";

    return cursor;
  }

  /**
   * Update cursor position
   * @param {HTMLElement} cursorElement - Cursor element
   * @param {Object} cursor - Position { line, ch } or character offset
   */
  updateCursorPosition(cursorElement, cursor) {
    let x, y;

    if (cursor.line !== undefined && cursor.ch !== undefined) {
      const pos = this.lineChToPixel(cursor.line, cursor.ch);
      x = pos.x;
      y = pos.y;
    } else if (cursor.position !== undefined) {
      const pos = this.positionToPixel(cursor.position);
      x = pos.x;
      y = pos.y;
    } else {
      return;
    }

    cursorElement.style.left = `${x}px`;
    cursorElement.style.top = `${y}px`;
  }

  /**
   * Convert line/ch to pixel position
   * @param {number} line - Line number
   * @param {number} ch - Character position
   * @returns {Object} { x, y }
   */
  lineChToPixel(line, ch) {
    if (!this.editorElement) {
      return { x: 0, y: 0 };
    }

    const lineHeight = 24;
    const charWidth = 8.5;

    return {
      x: ch * charWidth,
      y: line * lineHeight,
    };
  }

  /**
   * Convert character position to pixel
   * @param {number} position - Character position
   * @returns {Object} { x, y }
   */
  positionToPixel(position) {
    if (!this.editorElement || !this.editorElement.value) {
      return { x: 0, y: 0 };
    }

    const text = this.editorElement.value.substring(0, position);
    const lineHeight = 24;
    const charWidth = 8.5;

    const lines = text.split("\n");
    const line = lines.length - 1;
    const ch = lines[lines.length - 1].length;

    return {
      x: ch * charWidth,
      y: line * lineHeight,
    };
  }

  /**
   * Update remote selection
   * @param {string} userId - User ID
   * @param {Object} user - User data
   * @param {Object} selection - Selection { start, end }
   */
  updateSelection(userId, user, selection) {
    let selectionElement = document.getElementById(`selection-${userId}`);

    if (!selectionElement) {
      selectionElement = document.createElement("div");
      selectionElement.id = `selection-${userId}`;
      selectionElement.className = "remote-selection";
      selectionElement.dataset.userId = userId;
      selectionElement.style.position = "absolute";
      selectionElement.style.zIndex = "999";
      selectionElement.style.pointerEvents = "none";
      this.container.appendChild(selectionElement);
    }

    const startPos = this.positionToPixel(selection.start);
    const endPos = this.positionToPixel(selection.end);

    selectionElement.style.backgroundColor = `${user.color}33`;
    selectionElement.style.left = `${startPos.x}px`;
    selectionElement.style.top = `${startPos.y}px`;
    selectionElement.style.width = `${Math.abs(endPos.x - startPos.x)}px`;
    selectionElement.style.height = `${Math.abs(endPos.y - startPos.y) + 24}px`;
  }

  /**
   * Remove cursor
   * @param {string} userId - User ID
   */
  removeCursor(userId) {
    if (this.cursors.has(userId)) {
      const cursorElement = this.cursors.get(userId);
      cursorElement.remove();
      this.cursors.delete(userId);
    }
  }

  /**
   * Remove selection
   * @param {string} userId - User ID
   */
  removeSelection(userId) {
    const selectionElement = document.getElementById(`selection-${userId}`);
    if (selectionElement) {
      selectionElement.remove();
    }
  }

  /**
   * Remove user
   * @param {string} userId - User ID
   */
  removeUser(userId) {
    this.removeCursor(userId);
    this.removeSelection(userId);
  }

  /**
   * Update all cursors (editor resize)
   */
  updateAllCursors() {
    for (const [userId, cursorElement] of this.cursors) {
      const user = cursorElement.dataset;
      if (user.cursor) {
        this.updateCursorPosition(cursorElement, user.cursor);
      }
    }
  }

  /**
   * Clear all
   */
  clearAll() {
    for (const cursorElement of this.cursors.values()) {
      cursorElement.remove();
    }
    this.cursors.clear();

    const selections = document.querySelectorAll(".remote-selection");
    selections.forEach((sel) => sel.remove());
  }

  /**
   * Destroy
   */
  destroy() {
    this.clearAll();
    this.container = null;
    this.editorElement = null;
  }
}

window.CursorRenderer = CursorRenderer;
const cursorRenderer = new CursorRenderer();

export { cursorRenderer, CursorRenderer };
