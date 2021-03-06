import { app, BrowserWindow, screen } from 'electron';
import * as path from 'path';

export default class Main {
  static mainWin: BrowserWindow;
  static authWin: BrowserWindow;
  static videoWindow: BrowserWindow;

  static application: Electron.App;
  static BrowserWindow;

  static readonly videoUrl = `file:///${__dirname}/video/index.html`;

  static onWindowAllClosed() {
    if (process.platform !== 'darwin')
        Main.application.quit();
  }
  static mainOnClose(){
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      Main.mainWin = null;        
  }

  static mainOnReady(){
    // this is a dependency we will have to live with
    // because we can't create BrowserWindow until
    // onReady fires.
    Main.mainWin = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 720,
        minHeight: 640,
        acceptFirstMouse: true,
        webPreferences: {
          nodeIntegration: true
        }
    });
    if (process.defaultApp) {
      require('electron-reload')(__dirname, {});
      Main.mainWin.webContents.openDevTools();
      Main.mainWin.loadURL('http://localhost:4200');
    }
    else {
      Main.mainWin.loadFile(path.join(__dirname, './client/index.html'));
    }
    Main.mainWin.on('closed', Main.mainOnClose);
    // TODO - for prod, load from a file instead
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow){
      Main.BrowserWindow = browserWindow;
      Main.application = app;
      Main.application.on('window-all-closed', Main.onWindowAllClosed);
      Main.application.on('ready', Main.mainOnReady);
  }

  static sendMessage(name:string, data:any) {
      Main.mainWin.webContents.send(name, data)
  }

  static createVideoWindow(params: {videoId: string, time: string}) {

    if (Main.videoWindow) {
      Main.changeVideoUrl(params);
      return;
    }
    
    Main.videoWindow = new BrowserWindow({
        show: true,
        width: 750,
        height: 530,
        'minWidth': 720,
        'minHeight': 100,
        'acceptFirstMouse': true,
        'titleBarStyle': 'hidden',
        'alwaysOnTop': true,
        webPreferences: {
          nodeIntegration: true
        }
    });
    Main.changeVideoUrl(params);

    Main.videoWindow.once('ready-to-show', () => {
        Main.videoWindow.show();
    });

    Main.videoWindow.on('closed', () => {
        Main.videoWindow = null;
    });

    Main.videoWindow.webContents.on('new-window', function(e, url) {
      e.preventDefault();
      require('electron').shell.openExternal(url);
    });
  }

  static changeVideoUrl(params: {videoId: string, time: string}) {
    Main.videoWindow.loadURL(Main.videoUrl + `?videoId=${params.videoId}&time=${params.time}`);
  }
}