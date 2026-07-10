const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Sistema Residencial v1",
        fullscreen: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Eliminar la barra de menú superior (File, Edit, etc.)
    win.removeMenu();

    // Habilitar F11 para alternar pantalla completa
    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' && input.type === 'keyDown') {
            win.setFullScreen(!win.isFullScreen());
            event.preventDefault();
        }
    });

    // Intenta cargar el servidor de desarrollo, si falla usa los estáticos
    win.loadURL('http://localhost:3000').catch(() => {
        win.loadFile(path.join(__dirname, 'out/index.html'));
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});