import { Controller, Get, Query } from '@nestjs/common';
import { MainService } from './main.service';

@Controller('vpn')
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @Get('create')
  create(@Query('publicKey') publicKey: string) {
    return this.mainService.addVpn(publicKey);
  }

  @Get('remove')
  remove(@Query('publicKey') publicKey: string) {
    return this.mainService.removeVpn(publicKey);
  }

  @Get('list')
  list() {
    return this.mainService.listUser();
  }

  @Get('check')
  check(@Query('publicKey') publicKey: string) {
    return this.mainService.checkToken(publicKey);
  }
}
