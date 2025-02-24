import { PlatformAccessory } from 'homebridge';
import { IKHomeBridgeHomebridgePlatform } from '../platform';
import { BaseAccessory } from '../accessory/baseAccessory';
import { SensorService } from './sensorService';
import { ShortEvent } from '../webhook/subscriptionHandler';

export class CarbonMonoxideDetectorService extends SensorService {
  serviceName = 'CarbonMonixideDetector';

  constructor(platform: IKHomeBridgeHomebridgePlatform, accessory: PlatformAccessory, capabilities: string[], componentId: string,
    baseAccessory: BaseAccessory, name: string, deviceStatus) {
    super(platform, accessory, capabilities, componentId, baseAccessory, name, deviceStatus);

    this.initService(platform.Service.CarbonMonoxideSensor,
      platform.Characteristic.CarbonMonoxideDetected,
      (status) => {
        const deviceStatus = status.carbonMonoxideDetector.carbonMonoxide.value;
        if (deviceStatus === null || deviceStatus === undefined) {
          this.log.warn(`${this.name} returned bad value for status`);
          throw('Bad Value');
        }
        return deviceStatus === 'detected' ?
          this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL :
          this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL;
      });

    this.log.debug(`Adding ${this.serviceName} Service to ${this.name}`);
  }

  public processEvent(event: ShortEvent): void {
    this.log.debug(`Event updating CO detection for ${this.name} to ${event.value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.CarbonDioxideDetected,
      (event.value === 'detected' ? this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL :
        this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL) );
  }
}