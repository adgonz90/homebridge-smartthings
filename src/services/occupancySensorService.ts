import { PlatformAccessory } from 'homebridge';
import { IKHomeBridgeHomebridgePlatform } from '../platform';
import { BaseAccessory } from '../accessory/baseAccessory';
import { SensorService } from './sensorService';
import { ShortEvent } from '../webhook/subscriptionHandler';

export class OccupancySensorService extends SensorService {

  constructor(platform: IKHomeBridgeHomebridgePlatform, accessory: PlatformAccessory, capabilities: string[], componentId: string,
    baseAccessory: BaseAccessory, name: string, deviceStatus) {
    super(platform, accessory, capabilities, componentId, baseAccessory, name, deviceStatus);

    this.log.debug(`Adding OccupancySensorService to ${this.name}`);

    this.initService(platform.Service.OccupancySensor, platform.Characteristic.OccupancyDetected, (status) => {
      if (status.presenceSensor.presence.value === null || status.presenceSensor.presence.value === undefined) {
        this.log.warn(`${this.name} returned bad value for status`);
        throw('Bad Value');
      }
      return status.presenceSensor.presence.value === 'present' ? 1 : 0;
    });
  }

  public processEvent(event: ShortEvent): void {
    this.log.debug(`Event updating occupancy (presence) for ${this.name} to ${event.value}`);
    this.service.updateCharacteristic(
      this.platform.Characteristic.OccupancyDetected,
      event.value === 'present' ? 1 : 0);
  }
}