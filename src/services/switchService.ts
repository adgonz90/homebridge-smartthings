import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { IKHomeBridgeHomebridgePlatform } from '../platform';
import { BaseService } from './baseService';
import { BaseAccessory } from '../accessory/baseAccessory';
import { ShortEvent } from '../webhook/subscriptionHandler';

export class SwitchService extends BaseService {

  constructor(platform: IKHomeBridgeHomebridgePlatform, accessory: PlatformAccessory, capabilities: string[], componentId: string,
    baseAccessory: BaseAccessory, name: string, deviceStatus) {
    super(platform, accessory, capabilities, componentId, baseAccessory, name, deviceStatus);

    this.setServiceType(platform.Service.Switch);
    // Set the event handlers
    this.log.debug(`Adding SwitchService to ${this.name}`);
    this.service.getCharacteristic(platform.Characteristic.On)
      .onGet(this.getSwitchState.bind(this))
      .onSet(this.setSwitchState.bind(this));

    let pollSwitchesAndLightsSeconds = 10; // default to 10 seconds
    if (this.platform.config.PollSwitchesAndLightsSeconds !== undefined) {
      pollSwitchesAndLightsSeconds = this.platform.config.PollSwitchesAndLightsSeconds;
    }

    if (pollSwitchesAndLightsSeconds > 0) {
      baseAccessory.startPollingState(pollSwitchesAndLightsSeconds, this.getSwitchState.bind(this), this.service,
        platform.Characteristic.On);
    }
  }

  // Set the target state of the lock
  async setSwitchState(value: CharacteristicValue) {
    this.log.debug('Received setSwitchState(' + value + ') event for ' + this.name);

    if (!this.baseAccessory.isOnline) {
      this.log.error(this.name + ' is offline');
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
    this.baseAccessory.sendCommand(this.componentId, 'switch', value ? 'on' : 'off').then((success) => {
      if (success) {
        this.log.debug('onSet(' + value + ') SUCCESSFUL for ' + this.name);
        this.deviceStatus.timestamp = 0;  // Force a refresh next query.
      } else {
        this.log.error(`Command failed for ${this.name}`);
      }
    });
  }

  // Get the current state of the lock
  async getSwitchState(): Promise<CharacteristicValue> {
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    this.log.debug('Received getSwitchState() event for ' + this.name);

    return new Promise((resolve, reject) => {
      this.getStatus().then(success => {
        if (success) {
          let switchState;
          try {
            switchState = this.deviceStatus.status[this.componentId].switch.switch.value;
          } catch(error) {
            this.log.error(`Missing switch status from ${this.name}`);
          }
          this.log.debug(`Switch value from ${this.name}: ${switchState}`);
          resolve(switchState === 'on');
        } else {
          reject(new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE));
        }
      });
    });
  }

  public processEvent(event: ShortEvent): void {
    if (event.capability === 'switch') {
      this.log.debug(`Event updating switch capability for ${this.name} to ${event.value}`);
      this.service.updateCharacteristic(this.platform.Characteristic.On, event.value === 'on');
    }
  }
}