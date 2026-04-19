import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { checkHealth } from '../services/api';

const Settings = () => {
  const [serverStatus, setServerStatus] = useState(null);
  const [apiKeys, setApiKeys] = useState({
    huggingface: localStorage.getItem('hf_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || '',
    replicate: localStorage.getItem('replicate_api_token') || '',
    stability: localStorage.getItem('stability_api_key') || ''
  });
  const [preferences, setPreferences] = useState({
    autoSave: true,
    defaultProvider: 'huggingface',
    defaultResolution: '512x512',
    theme: 'dark'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    checkServerStatus();
    loadPreferences();
  }, []);

  const checkServerStatus = async () => {
    try {
      const status = await checkHealth();
      setServerStatus(status);
    } catch (error) {
      setServerStatus({ status: 'error' });
    }
  };

  const loadPreferences = () => {
    const stored = localStorage.getItem('aig_settings');
    if (stored) {
      setPreferences(prev => ({ ...prev, ...JSON.parse(stored) }));
    }
  };

  const handleSaveApiKeys = () => {
    localStorage.setItem('hf_api_key', apiKeys.huggingface);
    localStorage.setItem('openai_api_key', apiKeys.openai);
    localStorage.setItem('replicate_api_token', apiKeys.replicate);
    localStorage.setItem('stability_api_key', apiKeys.stability);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('aig_settings', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.7 }}>
        Configure API keys and application preferences
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Server Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={serverStatus?.status === 'ok' ? 'Connected' : 'Disconnected'}
                  color={serverStatus?.status === 'ok' ? 'success' : 'error'}
                  icon={serverStatus?.status === 'ok' ? <CheckIcon /> : <InfoIcon />}
                />
                {serverStatus?.version && (
                  <Typography variant="body2" color="text.secondary">
                    Version {serverStatus.version}
                  </Typography>
                )}
              </Box>
              
              {serverStatus?.features && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Available Features:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {serverStatus.features.map((feature) => (
                      <Chip
                        key={feature}
                        label={feature.replace(/-/g, ' ')}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Keys */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Keys
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure API keys for different AI providers
              </Typography>

              <TextField
                fullWidth
                label="Hugging Face API Key"
                type="password"
                value={apiKeys.huggingface}
                onChange={(e) => setApiKeys(prev => ({ ...prev, huggingface: e.target.value }))}
                sx={{ mb: 2 }}
                placeholder="hf_..."
              />

              <TextField
                fullWidth
                label="OpenAI API Key"
                type="password"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                sx={{ mb: 2 }}
                placeholder="sk-..."
              />

              <TextField
                fullWidth
                label="Replicate API Token"
                type="password"
                value={apiKeys.replicate}
                onChange={(e) => setApiKeys(prev => ({ ...prev, replicate: e.target.value }))}
                sx={{ mb: 2 }}
                placeholder="r8_..."
              />

              <TextField
                fullWidth
                label="Stability AI API Key"
                type="password"
                value={apiKeys.stability}
                onChange={(e) => setApiKeys(prev => ({ ...prev, stability: e.target.value }))}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveApiKeys}
                fullWidth
              >
                Save API Keys
              </Button>

              <Alert severity="info" sx={{ mt: 2 }}>
                API keys are stored locally in your browser. They are never sent to our servers.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferences
              </Typography>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto-save generated images"
                    secondary="Automatically save images to your local gallery"
                  />
                  <Switch
                    checked={preferences.autoSave}
                    onChange={(e) => setPreferences(prev => ({ ...prev, autoSave: e.target.checked }))}
                  />
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Default AI Provider"
                    secondary="Select your preferred AI provider"
                  />
                  <TextField
                    select
                    size="small"
                    value={preferences.defaultProvider}
                    onChange={(e) => setPreferences(prev => ({ ...prev, defaultProvider: e.target.value }))}
                    sx={{ minWidth: 150 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="huggingface">Hugging Face</option>
                    <option value="openai">OpenAI</option>
                    <option value="stability">Stability AI</option>
                    <option value="replicate">Replicate</option>
                  </TextField>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Default Resolution"
                    secondary="Default image size for generations"
                  />
                  <TextField
                    select
                    size="small"
                    value={preferences.defaultResolution}
                    onChange={(e) => setPreferences(prev => ({ ...prev, defaultResolution: e.target.value }))}
                    sx={{ minWidth: 150 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="512x512">512×512</option>
                    <option value="768x512">768×512</option>
                    <option value="512x768">512×768</option>
                    <option value="1024x1024">1024×1024</option>
                  </TextField>
                </ListItem>
              </List>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePreferences}
                fullWidth
                sx={{ mt: 2 }}
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;