const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

// Dictionary to store sessions
const sessions = {};

// Create session
app.post('/api/v1/create-session', (req, res) => {
    const sessionId = uuidv4();
    sessions[sessionId] = { files: [], result: 0 };
    res.json({ Session_id: sessionId });
});

// Upload file and solve equations
app.post('/api/v1/upload-file/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }
    if (sessions[sessionId].files.length >= 15) {
        const oldestFile = sessions[sessionId].files.shift();
        deleteFile(sessionId, oldestFile);
    }

    const fileContent = req.body.content;
    const equations = fileContent.split('\n').map(eq => eval(eq.trim()));
    const sum = equations.reduce((acc, cur) => acc + cur, 0);

    sessions[sessionId].files.push(fileContent);
    sessions[sessionId].result += sum;

    res.json({ Result: sessions[sessionId].result });
});

// Delete session
app.delete('/api/v1/delete-session/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }
    delete sessions[sessionId];
    res.json({ message: 'Session deleted successfully' });
});

// Delete file from session
app.delete('/api/v1/delete-file/:sessionId/:fileIndex', (req, res) => {
    const sessionId = req.params.sessionId;
    const fileIndex = parseInt(req.params.fileIndex);
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }
    if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= sessions[sessionId].files.length) {
        return res.status(400).json({ error: 'Invalid file index' });
    }

    const deletedEquations = sessions[sessionId].files.splice(fileIndex, 1)[0].split('\n').map(eq => eval(eq.trim()));
    const deletedSum = deletedEquations.reduce((acc, cur) => acc + cur, 0);
    sessions[sessionId].result -= deletedSum;

    res.json({ Result: sessions[sessionId].result });
});

function deleteFile(sessionId, fileName) {
    const index = sessions[sessionId].files.indexOf(fileName);
    if (index !== -1) {
        sessions[sessionId].files.splice(index, 1);
        const equations = fileName.split('\n').map(eq => eval(eq.trim()));
        const sum = equations.reduce((acc, cur) => acc + cur, 0);
        sessions[sessionId].result -= sum;
    }
}

const PORT = 3000;
app.get('/', (req, res) => {
    res.send('Server is running');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
