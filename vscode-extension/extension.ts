import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const views = [
    { id: 'anyrealm-architect', title: 'ROM Architect Dashboard' },
    { id: 'anyrealm-image-kitchen', title: 'Android Image Kitchen' },
    { id: 'anyrealm-aosp-architect', title: 'AOSP Architect' },
    { id: 'anyrealm-debos-builder', title: 'Debos Rootfs Builder' },
    { id: 'anyrealm-super-partition', title: 'Super Partition Studio' },
    { id: 'anyrealm-nethunter', title: 'NetHunter System Integrator' },
    { id: 'anyrealm-verification', title: 'Verification & Safety Cockpit' },
    { id: 'anyrealm-firmware-decomposer', title: 'Firmware Decomposer' },
    { id: 'anyrealm-gki-manager', title: 'GKI Version Manager' }
  ];

  for (const v of views) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`anyrealm.open.${v.id}`, () => {
        const panel = vscode.window.createWebviewPanel(
          v.id,
          `AnyRealm - ${v.title}`,
          vscode.ViewColumn.Active,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );

        panel.webview.html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${v.title}</title>
            </head>
            <body style="margin:0; padding:0; height:100vh; overflow:hidden;">
              <iframe src="http://localhost:3000" style="width:100%; height:100%; border:none;"></iframe>
            </body>
          </html>
        `;
      })
    );
  }
}

export function deactivate() {}
