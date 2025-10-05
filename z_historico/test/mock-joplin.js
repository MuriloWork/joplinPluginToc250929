// test/mock-joplin.js
// Simple in-memory mock of joplin.data for local tests.

global.joplin = {
  data: {
    _notes: new Map(),
    async get([resource, id], opts) {
      if (resource !== 'notes') throw new Error('mock only supports notes');
      const note = this._notes.get(id);
      if (!note) throw new Error('note not found: ' + id);
      return { id, body: note.body, updated_time: note.updated_time || Date.now() };
    },
    async put([resource, id], _null, payload) {
      if (resource !== 'notes') throw new Error('mock only supports notes');
      const existing = this._notes.get(id) || { id, body: '' };
      existing.body = payload.body;
      existing.updated_time = Date.now();
      this._notes.set(id, existing);
      return existing;
    },
    __seed(note) { this._notes.set(note.id, note); }
  }
};
