import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class MainService {
  // فعال کردن کاربر
  async activateUser(publicKey: string): Promise<string> {
    try {
      // دستور اضافه کردن کاربر به فایل wg0.conf
      const command = `wg set wg0 peer ${publicKey} allowed-ips ${publicKey}`;
      await execPromise(command);
      return 'User activated successfully';
    } catch (error) {
      throw new Error(`Error activating user: ${error.message}`);
    }
  }

  // غیرفعال کردن کاربر
  async deactivateUser(publicKey: string): Promise<string> {
    try {
      // دستور حذف کاربر از فایل wg0.conf
      const command = `wg set wg0 peer ${publicKey} remove`;
      await execPromise(command);
      return 'User deactivated successfully';
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }
}
