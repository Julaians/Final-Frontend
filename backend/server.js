/**
 * ==============================================================================
 * PlanIt Task Manager - Express & Gmail SMTP Backend Server
 * ==============================================================================
 * Endpoints:
 *  - GET  /                  : Server health and configuration check
 *  - GET  /api/health        : Health check endpoint
 *  - POST /send-email        : Sends real task alert emails via Gmail SMTP
 *  - POST /api/ai/breakdown  : AI Smart Task Assistant (Breakdown & Suggestions)
 * ==============================================================================
 * Ready for React (Vite) + Tailwind CSS migration & AI features.
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// 1. Nodemailer Gmail SMTP Transporter Setup
// -----------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        // Automatically strips any spaces from the 16-character app password (e.g., "abcd efgh ijkl mnop")
        pass: (process.env.GMAIL_APP_PASS || '').replace(/\s+/g, '')
    }
});

// Verify SMTP connection on server startup
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    transporter.verify((error) => {
        if (error) {
            console.error('\n❌ [Gmail SMTP] Authentication failed:');
            console.error('   ', error.message);
            console.log('   👉 Ensure 2-Step Verification is ON and you are using a 16-character Google App Password.\n');
        } else {
            console.log('\n✅ [Gmail SMTP] Connected successfully! Ready to send email notifications.\n');
        }
    });
} else {
    console.warn('\n⚠️ [Gmail SMTP] Warning: GMAIL_USER or GMAIL_APP_PASS is missing in your .env file.\n');
}

// -----------------------------------------------------------------------------
// 2. Health & Capabilities Endpoints
// -----------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.json({
        name: 'PlanIt Backend API',
        version: '1.2.0',
        status: 'online',
        smtpConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASS),
        aiConfigured: Boolean(process.env.GEMINI_API_KEY),
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// -----------------------------------------------------------------------------
// 3. POST /send-email: Accepts { to, subject, message, task }
// -----------------------------------------------------------------------------
const PRIORITY_THEMES = {
    High: { accent: '#fb7185', deep: '#e11d48', soft: '#2b1822', text: '#fecdd3', label: '🚨 HIGH PRIORITY', bannerSize: '18px', mailPriority: 'high' },
    Medium: { accent: '#38bdf8', deep: '#0284c7', soft: '#13283a', text: '#bae6fd', label: '⏰ MEDIUM PRIORITY', bannerSize: '16px', mailPriority: 'normal' },
    Low: { accent: '#34d399', deep: '#059669', soft: '#12291f', text: '#a7f3d0', label: '🔔 LOW PRIORITY', bannerSize: '15px', mailPriority: 'low' }
};

app.post('/send-email', async (req, res) => {
    // Wrapped in try/catch to ensure invalid emails or network drops never crash the server
    try {
        const { to, subject, message, task, html } = req.body;

        // Determine destination:
        // Use provided 'to' if present, otherwise fall back to NOTIFICATION_RECIPIENT or GMAIL_USER
        let recipient = (to && typeof to === 'string' && to.trim() !== '')
            ? to.trim()
            : (process.env.NOTIFICATION_RECIPIENT || process.env.GMAIL_USER);

        if (!recipient) {
            return res.status(400).json({
                success: false,
                error: 'Recipient email address ("to") is required.'
            });
        }

        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
            return res.status(500).json({
                success: false,
                error: 'Server is missing GMAIL_USER or GMAIL_APP_PASS in .env.'
            });
        }

        const emailSubject = subject || '🔔 OTS Task Notification';
        const emailMessage = message || 'You have an upcoming task deadline in PlanIt.';
        const theme = PRIORITY_THEMES[task && task.priority] || PRIORITY_THEMES.Medium;

        // Responsive HTML Card Template
        const defaultHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="color-scheme" content="dark">
            <style>
                body {
                    margin: 0;
                    padding: 28px 16px;
                    background-color: #0b0e17;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #e2e8f0;
                }
                .wrap { max-width: 580px; margin: 0 auto; }
                .brand { text-align: center; margin-bottom: 18px; }
                .badge {
                    display: inline-block;
                    background: #1e2347;
                    color: #a5b4fc;
                    font-weight: 900;
                    font-size: 13px;
                    letter-spacing: 1px;
                    padding: 9px 12px;
                    border-radius: 12px;
                    border: 1px solid #3b4290;
                }
                .brand-name { display: block; margin-top: 10px; font-size: 14px; font-weight: 700; color: #f8fafc; }
                .brand-tag { display: block; margin-top: 2px; font-size: 11px; color: #64748b; }
                .card {
                    background: #181e2c;
                    border: 1px solid #2c3550;
                    border-radius: 20px;
                    overflow: hidden;
                }
                .bar { height: 6px; background: ${theme.accent}; }
                .inner { padding: 28px; }
                .pill {
                    display: inline-block;
                    background: ${theme.deep};
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    padding: 5px 12px;
                    border-radius: 999px;
                }
                h1 { margin: 14px 0 0; font-size: 22px; line-height: 1.3; color: #ffffff; }
                .banner {
                    background: ${theme.soft};
                    border-left: 4px solid ${theme.accent};
                    padding: 14px 18px;
                    border-radius: 10px;
                    font-size: ${theme.bannerSize};
                    font-weight: 600;
                    line-height: 1.45;
                    color: ${theme.text};
                    margin: 18px 0 6px;
                }
                table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 14px; }
                td { padding: 11px 4px; border-bottom: 1px solid #262e45; color: #e2e8f0; }
                td.label { color: #7c88a8; font-weight: 600; width: 34%; font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; }
                .subtasks { margin-top: 18px; padding: 16px; background: #131825; border: 1px solid #262e45; border-radius: 12px; font-size: 13px; color: #cbd5e1; }
                .footer { text-align: center; margin-top: 22px; font-size: 12px; color: #5b6784; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="wrap">
                <div class="brand">
                    <span class="badge">OTS</span>
                    <span class="brand-name">Online Task Scheduler</span>
                    <span class="brand-tag">Calm, timezone-aware planning</span>
                </div>
                <div class="card">
                    <div class="bar"></div>
                    <div class="inner">
                        <span class="pill">${theme.label}</span>
                        <h1>${task ? escapeXml(task.title || 'Untitled') : 'Task Notification'}</h1>
                        <div class="banner">⏰ ${escapeXml(emailMessage)}</div>
                        ${task ? `
                        <table>
                            <tr><td class="label">Priority</td><td><strong style="color: ${theme.accent};">${escapeXml(task.priority || 'Medium')}</strong></td></tr>
                            <tr><td class="label">Type</td><td>${task.type === 'work' ? 'Multi-Day Project' : task.type === 'recurring' ? 'Recurring Routine' : 'Meeting / Schedule'}</td></tr>
                            <tr><td class="label">Category</td><td>${escapeXml(task.category || 'General')}</td></tr>
                            ${task.type === 'work' ? `
                            <tr><td class="label">Timeline</td><td>${escapeXml(task.startDate)} to ${escapeXml(task.endDate)}</td></tr>
                            <tr><td class="label">Due Time</td><td>${escapeXml(task.endTime || '23:59')}</td></tr>
                            ` : `
                            <tr><td class="label">Date</td><td>${escapeXml(task.startDate || task.date || 'Today')}</td></tr>
                            <tr><td class="label">Time</td><td>${escapeXml(task.startTime || '09:00')} - ${escapeXml(task.endTime || '10:00')}</td></tr>
                            `}
                        </table>
                        ${Array.isArray(task.subtasks) && task.subtasks.length > 0 ? `
                        <div class="subtasks">
                            <strong style="color: #ffffff;">Checklist / Subtasks</strong>
                            <ul style="margin: 8px 0 0; padding-left: 20px; line-height: 1.7;">
                                ${task.subtasks.map(s => `<li>${escapeXml(s.title || s)}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                        ` : ''}
                    </div>
                </div>
                <div class="footer">Sent automatically by OTS Online Task Scheduler</div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"OTS Online Task Scheduler" <${process.env.GMAIL_USER}>`,
            to: recipient,
            subject: emailSubject,
            text: emailMessage,
            html: html || defaultHtml,
            priority: theme.mailPriority
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] ✅ MessageId: ${info.messageId} | Recipient: ${recipient}`);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully via Gmail SMTP!',
            messageId: info.messageId,
            recipient
        });

    } catch (error) {
        // Catches any fake email addresses, DNS resolution errors, or auth failures
        console.error('[Email Send Error] ❌:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email notification'
        });
    }
});

// -----------------------------------------------------------------------------
// 4. POST /api/ai/breakdown (AI Feature Foundation)
// -----------------------------------------------------------------------------
// Generates smart subtask breakdown, recommended category, and priority.
// Works out-of-the-box with built-in heuristics, or uses Google Gemini if GEMINI_API_KEY is present.
app.post('/api/ai/breakdown', async (req, res) => {
    try {
        const { title, description, category, type } = req.body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ success: false, error: 'Task title is required.' });
        }

        const taskTitle = title.trim();

        // 1. If GEMINI_API_KEY is provided, try Gemini 1.5 Flash
        if (process.env.GEMINI_API_KEY) {
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                const prompt = `You are PlanIt's AI Task Assistant. Analyze this task title: "${taskTitle}".
Return JSON only in this exact schema (no markdown, no backticks):
{
  "suggestedCategory": "Work" | "Study" | "Personal",
  "suggestedPriority": "High" | "Medium" | "Low",
  "suggestedType": "schedule" | "work",
  "subtasks": [
    { "title": "Subtask 1 action" },
    { "title": "Subtask 2 action" },
    { "title": "Subtask 3 action" }
  ],
  "aiTip": "Short practical 1-sentence tip"
}`;

                const aiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json' }
                    })
                });

                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    const textContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textContent) {
                        const parsed = JSON.parse(textContent);
                        return res.json({
                            success: true,
                            source: 'gemini-ai',
                            data: {
                                ...parsed,
                                subtasks: (parsed.subtasks || []).map((s, idx) => ({
                                    id: `sub_${Date.now()}_${idx}`,
                                    title: s.title || s,
                                    completed: false
                                }))
                            }
                        });
                    }
                }
            } catch (geminiErr) {
                console.warn('[AI Assistant] Gemini API error, falling back to smart rules:', geminiErr.message);
            }
        }

        // 2. Built-in Smart Heuristic Engine (Works with zero API keys)
        const smartResult = generateSmartBreakdown(taskTitle, category, type);
        return res.json({
            success: true,
            source: 'smart-heuristic-engine',
            data: smartResult
        });

    } catch (err) {
        console.error('[AI Assistant Error] ❌:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to process task breakdown'
        });
    }
});

// Built-in rule-based task intelligence
function generateSmartBreakdown(title, inputCategory, inputType) {
    const lower = title.toLowerCase();

    let suggestedCategory = inputCategory || 'Work';
    let suggestedPriority = 'Medium';
    let suggestedType = inputType || 'schedule';
    let subtasks = [];
    let aiTip = 'Break large tasks into 25-minute focused blocks for best focus.';

    if (lower.includes('exam') || lower.includes('study') || lower.includes('read') || lower.includes('quiz') || lower.includes('chapter')) {
        suggestedCategory = 'Study';
        suggestedPriority = lower.includes('exam') || lower.includes('final') ? 'High' : 'Medium';
        suggestedType = lower.includes('exam') ? 'schedule' : 'work';
        subtasks = [
            { id: 'sub_1', title: 'Review lecture slides & key terminology', completed: false },
            { id: 'sub_2', title: 'Solve 5-10 practice questions', completed: false },
            { id: 'sub_3', title: 'Summarize key takeaways on cheat sheet', completed: false }
        ];
        aiTip = 'Use active recall and spaced repetition instead of passive rereading.';
    } else if (lower.includes('deploy') || lower.includes('migration') || lower.includes('database') || lower.includes('api') || lower.includes('backend') || lower.includes('release')) {
        suggestedCategory = 'Work';
        suggestedPriority = 'High';
        suggestedType = 'work';
        subtasks = [
            { id: 'sub_1', title: 'Perform full data backup & dry-run test', completed: false },
            { id: 'sub_2', title: 'Execute rollout and run integration test suite', completed: false },
            { id: 'sub_3', title: 'Monitor application logs & verify health metrics', completed: false }
        ];
        aiTip = 'Always establish a verified rollback plan before production execution.';
    } else if (lower.includes('design') || lower.includes('wireframe') || lower.includes('ui') || lower.includes('ux') || lower.includes('figma')) {
        suggestedCategory = 'Work';
        suggestedPriority = 'Medium';
        suggestedType = 'work';
        subtasks = [
            { id: 'sub_1', title: 'Gather requirements & competitive inspiration', completed: false },
            { id: 'sub_2', title: 'Draft high-fidelity components in Figma', completed: false },
            { id: 'sub_3', title: 'Conduct peer review & accessibility check', completed: false }
        ];
        aiTip = 'Test designs on both mobile viewports and dark mode early.';
    } else if (lower.includes('meeting') || lower.includes('sync') || lower.includes('call') || lower.includes('interview') || lower.includes('standup')) {
        suggestedCategory = 'Work';
        suggestedPriority = 'Medium';
        suggestedType = 'schedule';
        subtasks = [
            { id: 'sub_1', title: 'Draft agenda and distribute pre-read materials', completed: false },
            { id: 'sub_2', title: 'Conduct meeting and record decisions', completed: false },
            { id: 'sub_3', title: 'Send follow-up action items with owners', completed: false }
        ];
        aiTip = 'Keep meetings focused by clarifying the desired outcome upfront.';
    } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('doctor') || lower.includes('grocery') || lower.includes('clean') || lower.includes('pay')) {
        suggestedCategory = 'Personal';
        suggestedPriority = lower.includes('doctor') || lower.includes('pay') ? 'High' : 'Low';
        suggestedType = 'schedule';
        subtasks = [
            { id: 'sub_1', title: 'Prepare necessary materials/checklist', completed: false },
            { id: 'sub_2', title: 'Execute planned routine', completed: false },
            { id: 'sub_3', title: 'Check off completion and log notes', completed: false }
        ];
    } else {
        subtasks = [
            { id: 'sub_1', title: `Define scope & success criteria for "${title}"`, completed: false },
            { id: 'sub_2', title: 'Execute core milestones', completed: false },
            { id: 'sub_3', title: 'Final review and verification', completed: false }
        ];
    }

    return {
        suggestedCategory,
        suggestedPriority,
        suggestedType,
        subtasks,
        aiTip
    };
}

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 PlanIt Backend Server is running on http://localhost:${PORT}`);
    console.log(`📧 Email Endpoint: POST http://localhost:${PORT}/send-email`);
    console.log(`✨ AI Assistant:   POST http://localhost:${PORT}/api/ai/breakdown`);
    console.log(`======================================================\n`);
});
