import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as shell from 'shelljs';
import * as path from 'path';
import { promisify } from 'util';
import sleep from 'sleep-promise';
import { spawn } from 'node:child_process';

const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

@Injectable()
export class MainService {
  private privateIP: number | null = null;

  private async findIp(): Promise<number> {
    const filePath = '/etc/wireguard/wg0.conf';
    const data = await readFile(filePath, 'utf8');

    const allowedIPs: string[] = [];

    const lines = data.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('AllowedIPs')) {
        const ips = line.split('=')[1].trim().split(',');
        for (const ip of ips) {
          allowedIPs.push(ip.trim());
        }
      }
    }

    for (let i = 3; i < 250; i++) {
      const ipToCheck = `10.66.66.${i}/32`;
      if (!allowedIPs.includes(ipToCheck)) {
        this.privateIP = i;
        return i;
      }
    }

    throw new Error('No available IPs');
  }

  async checkToken(publicKey: string) {
    const filePath = `/root/wg0-client-${publicKey}.conf`;
    const existsFile = await exists(filePath);
    return existsFile;
  }

  async addVpn(publicKey: string) {
    if (!this.privateIP) {
      await this.findIp();
    }
    await sleep(2000);

    const filePath = `/root/wg0-client-${publicKey}.conf`;
    const fileExists = await exists(filePath);

    const result = shell.exec('/home/jwpn/wireguard-install.sh', { async: true });

    if (result.stdin) {
      result.stdin.write('1\n');
      result.stdin.write(`${publicKey}\n`);
      result.stdin.write(`${this.privateIP}\n`);
      result.stdin.write(`${this.privateIP}\n`);
      result.stdin.end();
      
      // حالا باید گوش بدیم به خروجی
      let stdoutData = '';
    
      result.stdout?.on('data', (data) => {
        stdoutData += data.toString();
      });
    
      await new Promise<void>((resolve, reject) => {
        result.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });
      });
    
      return stdoutData;
    } else {
      throw new Error('stdin is not available in shell result');
    }
  }
  async removeVpn(publicKey: string) {
    const result = shell.exec('/home/jwpn/wireguard-install.sh', { async: true });
  
    if (!result.stdin) {
      throw new Error('stdin is not available. Failed to start shell script.');
    }
  
    result.stdin.write('3\n');
  
    return new Promise((resolve, reject) => {
      result.stdout?.on('data', (data) => {
        const regex = new RegExp(`(\\d+)\\) ${publicKey}`);
        const matches = regex.exec(data.toString());
  
        if (matches && matches[1]) {
          const numberBefore = parseInt(matches[1]);
          result.stdin?.write(`${numberBefore}\n`);
        }
      });
  
      result.on('close', (code) => {
        if (code === 0) {
          resolve('User removed successfully');
        } else {
          reject(new Error(`Failed to remove user. Exit code: ${code}`));
        }
      });
  
      result.on('error', (err) => {
        reject(err);
      });
    });
  }
  

  async listUser() {
    const result = spawn('/home/jwpn/wireguard-install.sh', [], { stdio: ['pipe', 'pipe', 'pipe'] });
  
    // بررسی وجود stdout
    if (!result.stdout) {
      return Promise.reject(new Error('stdout موجود نیست، فرآیند به درستی شروع نشده است.'));
    }
  
    result.stdout.on('data', (data) => {
      console.log(`داده دریافتی: ${data}`);
    });
  
    result.stdin.write('2\n');
  
    return new Promise<string>((resolve, reject) => {
      let userList = '';
  
      result.stdout.on('data', (data) => {
        userList += data.toString();
      });
  
      result.on('close', async (code) => {
        if (code === 0) {
          resolve(userList);
        } else {
          reject(new Error(`فرآیند با کد خروجی ${code} شکست خورد.`));
        }
      });
  
      result.on('error', (err) => {
        reject(err);
      });
    });
  }
}
