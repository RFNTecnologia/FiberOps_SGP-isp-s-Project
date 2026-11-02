const { app, BrowserWindow, shell, Menu, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const APP_URL = process.env.FIBEROPS_URL || "https://joy-write-shine.lovable.app";

// Configuração do auto-updater
autoUpdater.autoDownload = false;
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0b1220",
    title: "FiberOps",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);

  // Links externos abrem no navegador padrão
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("did-fail-load", () => {
    win.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<body style="background:#0b1220;color:#e2e8f0;font-family:system-ui;display:flex;height:100vh;align-items:center;justify-content:center;text-align:center">
             <div><h2>Sem conexão</h2><p>Não foi possível carregar o FiberOps.<br/>Verifique sua internet e reabra o aplicativo.</p></div>
           </body>`,
        ),
    );
  });
}

Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    {
      label: "FiberOps",
      submenu: [
        { role: "reload", label: "Recarregar" },
        { role: "toggleDevTools", label: "Ferramentas de desenvolvedor" },
        { type: "separator" },
        { role: "quit", label: "Sair" },
      ],
    },
    {
      label: "Exibir",
      submenu: [
        { role: "zoomIn", label: "Aumentar zoom" },
        { role: "zoomOut", label: "Diminuir zoom" },
        { role: "resetZoom", label: "Zoom padrão" },
        { role: "togglefullscreen", label: "Tela cheia" },
      ],
    },
    {
      label: "Atualizações",
      submenu: [
        {
          label: "Verificar atualizações",
          click: () => {
            autoUpdater.checkForUpdates();
          },
        },
      ],
    },
  ]),
);

// Eventos do Auto-Updater
autoUpdater.on("update-available", (info) => {
  dialog
    .showMessageBox({
      type: "info",
      title: "Atualização disponível",
      message: `Uma nova versão (${info.version}) está disponível. Deseja baixar agora?`,
      buttons: ["Sim", "Não"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on("update-downloaded", () => {
  dialog
    .showMessageBox({
      type: "info",
      title: "Atualização pronta",
      message: "A atualização foi baixada e será instalada ao reiniciar o aplicativo.",
      buttons: ["Reiniciar agora", "Depois"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

autoUpdater.on("error", (err) => {
  console.error("Erro na atualização:", err);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
