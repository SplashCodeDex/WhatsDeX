import fs from 'node:fs';
import path from 'node:path';

const UPSTREAM_REPO = 'openclaw/openclaw';
const REPORT_PATH = path.join(process.cwd(), 'docs/OPENCLAW_UPSTREAM_REPORT.md');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GithubRelease {
    tag_name: string;
    published_at: string;
    html_url: string;
}

interface GithubPR {
    number: number;
    title: string;
    merged_at: string;
    html_url: string;
    user: { login: string };
}

async function fetchGithub(endpoint: string) {
    const response = await fetch(`https://api.github.com/repos/${UPSTREAM_REPO}${endpoint}`, {
        headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
    return response.json();
}

async function updateReport() {
    console.log('🚀 DeXMart Watchtower: Syncing with OpenClaw Upstream...');

    if (!fs.existsSync(REPORT_PATH)) {
        console.error(`❌ Error: Report file not found at ${REPORT_PATH}`);
        process.exit(1);
    }

    const existingContent = fs.readFileSync(REPORT_PATH, 'utf8');

    const releases: GithubRelease[] = await fetchGithub('/releases?per_page=10');
    const pulls: GithubPR[] = await fetchGithub('/pulls?state=closed&base=main&per_page=30');
    const mergedPulls = pulls.filter(pr => pr.merged_at);

    // 1. Identify New Releases (Using exact tag matching)
    const newReleases = releases.filter(rel => {
        const tagRegex = new RegExp(`\\b${rel.tag_name}\\b`);
        return !tagRegex.test(existingContent);
    });

    // 2. Identify New PRs (Using word boundaries for numbers)
    const newPRs = mergedPulls.filter(pr => {
        const prRegex = new RegExp(`#${pr.number}\\b`);
        return !prRegex.test(existingContent);
    });

    if (newReleases.length === 0 && newPRs.length === 0) {
        console.log('✅ No new upstream activity. Fusion ledger is current.');
        return;
    }

    console.log(`✨ Discovery: ${newReleases.length} releases, ${newPRs.length} merged PRs found.`);

    let updatedContent = existingContent;

    // Surgical Release Insertion (Matching existing row format)
    if (newReleases.length > 0) {
        const releaseHeader = '## 🚀 Latest Releases';
        let releaseEntries = '';
        newReleases.forEach(rel => {
            // Format: openclaw 2026.3.2	Latest	v2026.3.2	2026-03-03T04:43:00Z
            const version = rel.tag_name.replace(/^v/, '');
            releaseEntries += `openclaw ${version}\tLatest\t${rel.tag_name}\t${rel.published_at}\n`;
        });

        if (updatedContent.includes(releaseHeader)) {
            updatedContent = updatedContent.replace(releaseHeader, `${releaseHeader}\n\n${releaseEntries.trim()}`);
        }
    }

    // Surgical Pending Fusion Insertion
    if (newPRs.length > 0) {
        const pendingHeader = '## 📥 Pending Fusion (New Upstream Activity)';
        let prEntries = '';
        newPRs.forEach(pr => {
            prEntries += `- [ ] #${pr.number} ${pr.title} (${new Date(pr.merged_at).toLocaleDateString()}) @${pr.user.login} [View](${pr.html_url})\n`;
        });

        if (updatedContent.includes(pendingHeader)) {
            updatedContent = updatedContent.replace(pendingHeader, `${pendingHeader}\n${prEntries.trim()}`);
        } else {
            const syncHeader = '## ✅ Recently Synchronized';
            if (updatedContent.includes(syncHeader)) {
                updatedContent = updatedContent.replace(syncHeader, `${pendingHeader}\n${prEntries}\n\n${syncHeader}`);
            } else {
                updatedContent += `\n\n${pendingHeader}\n${prEntries}`;
            }
        }
    }

    // Timestamp Update
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    updatedContent = updatedContent.replace(/Generated on:\*\* .*/, `Generated on:** ${timestamp}`);
    updatedContent = updatedContent.replace(/Report Updated:\*\* .*/, `Report Updated:** ${timestamp}`);

    fs.writeFileSync(REPORT_PATH, updatedContent);
    console.log(`✅ Success: Intelligence Ledger updated safely.`);
}

updateReport().catch(err => {
    console.error('❌ Critical Error during Watchtower sync:', err);
    process.exit(1);
});
