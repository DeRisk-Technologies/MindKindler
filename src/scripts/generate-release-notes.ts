// src/scripts/generate-release-notes.ts
import * as fs from 'fs';
import * as path from 'path';

// Define types for Packs
interface Pack {
    id: string;
    name: string;
    version: string;
    releaseDate?: string;
    changelog?: string;
}

const CATALOG_DIR = path.join(process.cwd(), 'src/marketplace/catalog');
const OUT_FILE = path.join(process.cwd(), 'public/release-notes.json');
const CHANGELOG_FILE = path.join(process.cwd(), 'CHANGELOG.md');
const PACKAGE_FILE = path.join(process.cwd(), 'package.json');

async function main() {
    console.log("Generating Release Notes...");

    // 1. Read App Version
    let appVersion = "0.0.0";
    try {
        const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
        appVersion = pkg.version;
    } catch (e) {
        console.warn("package.json not found or invalid.");
    }

    // 2. Read Packs
    const packs: Pack[] = [];
    if (fs.existsSync(CATALOG_DIR)) {
        const files = fs.readdirSync(CATALOG_DIR);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(CATALOG_DIR, file), 'utf-8');
                    const json = JSON.parse(content);
                    if (json.id && json.version) {
                        packs.push({
                            id: json.id,
                            name: json.name,
                            version: json.version,
                            releaseDate: json.releaseDate,
                            changelog: json.changelog
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to parse ${file}`, e);
                }
            }
        });
    }

    // 3. Read App Changelog
    let appChangelog = "";
    try {
        appChangelog = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
    } catch (e) {
        console.warn("CHANGELOG.md not found.");
    }

    // 4. Construct Output
    const output = {
        generatedAt: new Date().toISOString(),
        app: {
            version: appVersion,
            changelog: appChangelog
        },
        packs: packs.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
    };

    // 5. Write
    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Release notes written to ${OUT_FILE}`);
}

main().catch(console.error);
