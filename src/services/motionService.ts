import { PlatformAccessory } from 'homebridge';
import { IKHomeBridgeHomebridgePlatform } from '../platform';
import { BaseAccessory } from '../accessory/baseAccessory';
import { SensorService } from './sensorService';
import { ShortEvent } from '../webhook/subscriptionHandler';

export class MotionService extends SensorService {

  constructor(platform: IKHomeBridgeHomebridgePlatform, accessory: PlatformAccessory, capabilities: string[], componentId: string,
    baseAccessory: BaseAccessory, name: string, deviceStatus) {
    super(platform, accessory, capabilities, componentId, baseAccessory, name, deviceStatus);

    this.log.debug(`Adding MotionService to ${this.name}`);

    this.initService(platform.Service.MotionSensor, platform.Characteristic.MotionDetected, (status) => {
      if (status.motionSensor.motion.value === null || status.motionSensor.motion.value === undefined) {
        this.log.warn(`${this.name} returned bad value for status`);
        throw('Bad Value');
      }
      return status.motionSensor.motion.value === 'active' ? true : false;
    });
  }

  public processEvent(event: ShortEvent): void {
    this.log.debug(`Updating ${this.name} from evnent to ${event.value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.MotionDetected, event.value === 'active' ? true : false);
  }
}