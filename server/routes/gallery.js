const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');

router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ images, total: images.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read gallery' });
  }
});

router.get('/search', (req, res) => {
  try {
    const { query, type, dateFrom, dateTo } = req.query;
    const files = fs.readdirSync(uploadsDir);
    
    let images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });
    
    if (query) {
      images = images.filter(img => 
        img.filename.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (type) {
      images = images.filter(img => {
        if (type === 'upscaled') return img.filename.includes('_upscaled');
        if (type === 'edited') return img.filename.includes('_inpainted') || img.filename.includes('_outpainted') || img.filename.includes('_img2img');
        if (type === 'variation') return img.filename.includes('_variation');
        return true;
      });
    }
    
    if (dateFrom) {
      images = images.filter(img => img.createdAt >= new Date(dateFrom));
    }
    
    if (dateTo) {
      images = images.filter(img => img.createdAt <= new Date(dateTo));
    }
    
    images.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ images, total: images.length });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image deleted' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;