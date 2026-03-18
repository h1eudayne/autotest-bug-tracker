const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BUGS_FILE = path.join(__dirname, '..', 'bugs', 'bugs.json');

// Helper: read bugs
function readBugs() {
  if (!fs.existsSync(BUGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BUGS_FILE, 'utf-8'));
}

// Helper: write bugs
function writeBugs(bugs) {
  fs.writeFileSync(BUGS_FILE, JSON.stringify(bugs, null, 2));
}

// GET /api/bugs - list all bugs
app.get('/api/bugs', (req, res) => {
  const bugs = readBugs();
  const { project, severity, status } = req.query;
  
  let filtered = bugs;
  if (project) filtered = filtered.filter(b => b.project === project);
  if (severity) filtered = filtered.filter(b => b.severity === severity);
  if (status) filtered = filtered.filter(b => b.status === status);
  
  res.json(filtered);
});

// PATCH /api/bugs/:id - update bug status
app.patch('/api/bugs/:id', (req, res) => {
  const bugs = readBugs();
  const bug = bugs.find(b => b.id === req.params.id);
  if (!bug) return res.status(404).json({ error: 'Bug not found' });
  
  Object.assign(bug, req.body);
  writeBugs(bugs);
  res.json(bug);
});

// POST /api/bugs/open-code - open VS Code at file:line
app.post('/api/bugs/open-code', (req, res) => {
  const { file, line } = req.body;
  const cmd = `code -g "${file}:${line || 1}"`;
  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, command: cmd });
  });
});

// GET /api/stats - bug statistics
app.get('/api/stats', (req, res) => {
  const bugs = readBugs();
  res.json({
    total: bugs.length,
    open: bugs.filter(b => b.status === 'open').length,
    fixed: bugs.filter(b => b.status === 'fixed').length,
    high: bugs.filter(b => b.severity === 'high').length,
    critical: bugs.filter(b => b.severity === 'critical').length
  });
});

app.listen(PORT, () => {
  console.log(`Bug Dashboard running on http://localhost:${PORT}`);
});
