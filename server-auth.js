const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'genesis-secret-key-change-me';
const USERS_FILE = process.env.USERS_FILE || '/var/www/genesis-engine/users.json';
const VERIFICATIONS_FILE = process.env.VERIFICATIONS_FILE || '/var/www/genesis-engine/verifications.json';

// Email config - use Resend for production
const EMAIL_CONFIG = {
    apiKey: process.env.RESEND_API_KEY || '',
    from: 'Genesis AI <noreply@yourdomain.com>',
    enableEmail: !!process.env.RESEND_API_KEY
};

// Free daily quota
const FREE_DAILY_QUOTA = 20;

// Initialize users file
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}

if (!fs.existsSync(VERIFICATIONS_FILE)) {
    fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify({}));
}

function getUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getVerifications() {
    return JSON.parse(fs.readFileSync(VERIFICATIONS_FILE, 'utf8'));
}

function saveVerifications(verifications) {
    fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(verifications, null, 2));
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getDailyUsage(userId) {
    const users = getUsers();
    const user = users[userId];
    if (!user) return 0;
    
    const today = new Date().toDateString();
    const lastDate = user.lastGenerationDate;
    
    if (lastDate !== today) {
        user.dailyUsed = 0;
        user.lastGenerationDate = today;
        saveUsers(users);
    }
    return user.dailyUsed || 0;
}

function incrementUsage(userId) {
    const users = getUsers();
    const user = users[userId];
    if (!user) return;
    
    const today = new Date().toDateString();
    if (user.lastGenerationDate !== today) {
        user.dailyUsed = 0;
        user.lastGenerationDate = today;
    }
    user.dailyUsed = (user.dailyUsed || 0) + 1;
    user.totalGenerations = (user.totalGenerations || 0) + 1;
    saveUsers(users);
}

function hasQuota(userId) {
    return getDailyUsage(userId) < FREE_DAILY_QUOTA;
}

// Send email using Resend API
async function sendEmail(to, subject, html) {
    if (!EMAIL_CONFIG.enableEmail) {
        console.log(`[EMAIL] Would send to ${to}: ${subject}`);
        return { success: true, mock: true };
    }
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: EMAIL_CONFIG.from,
                to: to,
                subject: subject,
                html: html
            })
        });
        
        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ success: false, error: 'Invalid email format' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }
        
        const users = getUsers();
        const existingUser = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const code = generateCode();
        
        const userId = crypto.randomBytes(16).toString('hex');
        users[userId] = {
            id: userId,
            email: email.toLowerCase(),
            name: name || email.split('@')[0],
            password: hashedPassword,
            verified: false,
            createdAt: new Date().toISOString(),
            dailyUsed: 0,
            totalGenerations: 0,
            plan: 'free'
        };
        
        saveUsers(users);
        
        const verifications = getVerifications();
        verifications[email.toLowerCase()] = {
            code: code,
            userId: userId,
            expires: Date.now() + 15 * 60 * 1000
        };
        saveVerifications(verifications);
        
        // Send verification email
        await sendEmail(
            email,
            'Verify your Genesis AI account',
            `<h1>Welcome to Genesis AI!</h1>
            <p>Your verification code is:</p>
            <h2 style="font-size: 32px; letter-spacing: 4px;">${code}</h2>
            <p>This code expires in 15 minutes.</p>
            <p>If you didn't create an account, please ignore this email.</p>`
        );
        
        res.json({
            success: true,
            message: 'Registration successful. Please check your email for verification code.',
            userId: userId
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ success: false, error: 'Email and code required' });
        }
        
        const verifications = getVerifications();
        const verification = verifications[email.toLowerCase()];
        
        if (!verification) {
            return res.status(400).json({ success: false, error: 'No verification pending' });
        }
        
        if (verification.expires < Date.now()) {
            delete verifications[email.toLowerCase()];
            saveVerifications(verifications);
            return res.status(400).json({ success: false, error: 'Verification code expired' });
        }
        
        if (verification.code !== code) {
            return res.status(400).json({ success: false, error: 'Invalid verification code' });
        }
        
        const users = getUsers();
        const user = users[verification.userId];
        
        if (user) {
            user.verified = true;
            user.verifiedAt = new Date().toISOString();
            saveUsers(users);
        }
        
        delete verifications[email.toLowerCase()];
        saveVerifications(verifications);
        
        // Send welcome email
        await sendEmail(
            email,
            'Welcome to Genesis AI!',
            `<h1>Welcome to Genesis AI!</h1>
            <p>Your account is now verified.</p>
            <p>You have <strong>${FREE_DAILY_QUOTA} free generations</strong> per day.</p>
            <p>Start creating at: <a href="https://verilysovereign.org/genesis">Genesis Engine</a></p>`
        );
        
        res.json({
            success: true,
            message: 'Email verified successfully!'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        
        const users = getUsers();
        const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        if (!user.verified) {
            return res.status(401).json({ 
                success: false, 
                error: 'Please verify your email first',
                requiresVerification: true,
                userId: user.id
            });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const dailyUsed = getDailyUsage(user.id);
        
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan || 'free',
                dailyUsed: dailyUsed,
                dailyQuota: FREE_DAILY_QUOTA,
                remaining: FREE_DAILY_QUOTA - dailyUsed,
                totalGenerations: user.totalGenerations || 0
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token' });
        }
        
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const users = getUsers();
        const user = users[decoded.userId];
        
        if (!user || !user.verified) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }
        
        const dailyUsed = getDailyUsage(user.id);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan || 'free',
                dailyUsed: dailyUsed,
                dailyQuota: FREE_DAILY_QUOTA,
                remaining: FREE_DAILY_QUOTA - dailyUsed,
                totalGenerations: user.totalGenerations || 0
            }
        });
        
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

app.get('/api/auth/quota', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token' });
        }
        
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const dailyUsed = getDailyUsage(decoded.userId);
        
        res.json({
            success: true,
            dailyUsed: dailyUsed,
            dailyQuota: FREE_DAILY_QUOTA,
            remaining: FREE_DAILY_QUOTA - dailyUsed,
            canGenerate: dailyUsed < FREE_DAILY_QUOTA
        });
        
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

app.post('/api/auth/use-quota', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token' });
        }
        
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!hasQuota(decoded.userId)) {
            return res.status(403).json({ 
                success: false, 
                error: 'Daily quota exceeded',
                dailyUsed: getDailyUsage(decoded.userId),
                dailyQuota: FREE_DAILY_QUOTA
            });
        }
        
        incrementUsage(decoded.userId);
        
        const dailyUsed = getDailyUsage(decoded.userId);
        
        res.json({
            success: true,
            dailyUsed: dailyUsed,
            remaining: FREE_DAILY_QUOTA - dailyUsed
        });
        
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

app.post('/api/auth/resend-code', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }
        
        const users = getUsers();
        const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Email not found' });
        }
        
        if (user.verified) {
            return res.status(400).json({ success: false, error: 'Email already verified' });
        }
        
        const code = generateCode();
        
        const verifications = getVerifications();
        verifications[email.toLowerCase()] = {
            code: code,
            userId: user.id,
            expires: Date.now() + 15 * 60 * 1000
        };
        saveVerifications(verifications);
        
        await sendEmail(
            email,
            'Your Genesis AI verification code',
            `<h1>Verify your email</h1>
            <p>Your new verification code is:</p>
            <h2 style="font-size: 32px; letter-spacing: 4px;">${code}</h2>
            <p>This code expires in 15 minutes.</p>`
        );
        
        res.json({
            success: true,
            message: 'Verification code sent'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to resend code' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        version: '1.0.0',
        freeQuota: FREE_DAILY_QUOTA,
        emailConfigured: !!process.env.RESEND_API_KEY
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Genesis Auth Server running on port ${PORT}`);
    console.log(`Free daily quota: ${FREE_DAILY_QUOTA} generations/day`);
    console.log(`Email configured: ${!!process.env.RESEND_API_KEY}`);
});