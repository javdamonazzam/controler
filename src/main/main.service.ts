import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';  // برای کار با فایل
const wg0ConfigPath = '/etc/wireguard/wg0.conf';  // مسیر فایل کانفیگ WireGuard

@Injectable()
export class MainService {
async activateUser(publicKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.promises.readFile(wg0ConfigPath, 'utf-8')
      .then(config => {
        const updatedConfig = config.replace(
          new RegExp(`# ### Client ${publicKey}[\\s\\S]*?# AllowedIPs = [\\d\\.]+/32`, 'g'),
          match => match.split('\n').map(line => line.replace(/^# /, '')).join('\n')
        );

        return fs.promises.writeFile(wg0ConfigPath, updatedConfig, 'utf-8');
      })
      .then(() => {
        exec('sudo systemctl restart wg-quick@wg0', (error, stdout, stderr) => {
          if (error) {
            reject(`Error restarting WireGuard: ${error.message}`);
          } else {
            resolve('User activated successfully');
          }
        });
      })
      .catch(err => reject(`Error handling config file: ${err.message}`));
  });
}
async deactivateUser(publicKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.promises.readFile(wg0ConfigPath, 'utf-8')
      .then(config => {
        console.log(publicKey);
        console.log(config);
        const updatedConfig = config.replace(
          new RegExp(`### Client ${publicKey}[\\s\\S]*?AllowedIPs = [\\d\\.]+/32`, 'g'),
          match => match.split('\n').map(line => `# ${line}`).join('\n')
        );

        return fs.promises.writeFile(wg0ConfigPath, updatedConfig, 'utf-8');
      })
      .then(() => {
        exec('sudo systemctl restart wg-quick@wg0', (error, stdout, stderr) => {
          if (error) {
            reject(`Error restarting WireGuard: ${error.message}`);
          } else {
            resolve('User deactivated successfully');
          }
        });
      })
      .catch(err => reject(`Error handling config file: ${err.message}`));
  });
}
}