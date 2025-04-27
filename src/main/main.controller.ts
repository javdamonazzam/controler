import { Controller, Post, Query } from '@nestjs/common';
import { MainService } from './main.service';

@Controller('vpn')
export class MainController {
  constructor(private readonly mainService: MainService) {}

  // فعال کردن کاربر
  @Post('activate')
  async activate(@Query('publicKey') publicKey: string): Promise<string> {
    return this.mainService.activateUser(publicKey);
  }

  // غیرفعال کردن کاربر
  @Post('deactivate')
  async deactivate(@Query('publicKey') publicKey: string): Promise<string> {
    return this.mainService.deactivateUser(publicKey);
  }
}
