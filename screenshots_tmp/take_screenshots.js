const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const screenshotsDir = path.join(__dirname, 'screenshots_tmp');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    try {
        console.log('Navigating to login page...');
        await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '1_login.png') });
        console.log('Login screenshot taken.');

        // Attempt login
        console.log('Filling login form...');
        await page.type('input[name="usuario"]', 'admin', { delay: 50 });
        await page.type('input[name="contrasena"]', 'admin123', { delay: 50 });

        // Wait and take screenshot of filled form
        await delay(500);
        await page.screenshot({ path: path.join(screenshotsDir, '2_login_filled.png') });
        console.log('Login filled screenshot taken.');

        // Submit
        console.log('Submitting login...');
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard
        await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => console.log("No navigation event"));
        await delay(2000); // extra wait for animations

        console.log('Dashboard screenshot...');
        await page.screenshot({ path: path.join(screenshotsDir, '3_dashboard.png') });

        // Navigate to some other pages if possible (Menu, Orders)
        // Adjust these selectors based on the actual app if needed
        console.log('Navigating to Products...');
        await page.goto('http://localhost:4200/productos', { waitUntil: 'networkidle0' });
        await delay(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '4_productos.png') });

        console.log('Navigating to Sales...');
        await page.goto('http://localhost:4200/ventas', { waitUntil: 'networkidle0' });
        await delay(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '5_ventas.png') });

        console.log('Navigating to Users...');
        await page.goto('http://localhost:4200/usuarios', { waitUntil: 'networkidle0' });
        await delay(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '6_usuarios.png') });

    } catch (e) {
        console.error('Error during screenshot process:', e);
    } finally {
        await browser.close();
        console.log('Done.');
    }
}

run();
