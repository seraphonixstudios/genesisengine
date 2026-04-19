const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const workspacesDir = path.join(__dirname, '../workspaces');
if (!fs.existsSync(workspacesDir)) {
  fs.mkdirSync(workspacesDir, { recursive: true });
}

router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(workspacesDir);
    const workspaces = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(workspacesDir, file)));
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          imageCount: data.images ? data.images.length : 0
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }
    
    const workspace = {
      id: uuidv4(),
      name,
      description,
      images: [],
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(workspacesDir, `${workspace.id}.json`),
      JSON.stringify(workspace, null, 2)
    );
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(workspacesDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const workspace = JSON.parse(fs.readFileSync(filePath));
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(workspacesDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const existing = JSON.parse(fs.readFileSync(filePath));
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(workspacesDir, `${id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Workspace not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

router.post('/:id/images', (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, filename, metadata = {} } = req.body;
    const filePath = path.join(workspacesDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const workspace = JSON.parse(fs.readFileSync(filePath));
    workspace.images.push({
      id: uuidv4(),
      url: imageUrl,
      filename: filename,
      addedAt: new Date().toISOString(),
      metadata
    });
    workspace.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add image to workspace' });
  }
});

module.exports = router;