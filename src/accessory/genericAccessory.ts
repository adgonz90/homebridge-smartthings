import { PlatformAccessory, Characteristic, CharacteristicValue, Service, WithUUID } from 'homebridge';
//import axios = require('axios');
import { IKHomeBridgeHomebridgePlatform } from '../platform';
import { BaseService } from '../services/baseService';
import { BaseAccessory } from './baseAccessory';
import { MotionService } from '../services/motionService';
import { BatteryService } from '../services/batteryService';
import { TemperatureService } from '../services/temperatureService';
import { HumidityService } from '../services/humidityService';
import { LightSensorService } from '../services/lightSensorService';
import { ContactSensorService } from '../services/contactSensorService';
import { LockService } from '../services/lockService';
import { DoorService } from '../services/doorService';
import { SwitchService } from '../services/switchService';
import { LightService } from '../services/lightService';
import { FanSwitchLevelService } from '../services/fanSwitchLevelService';
import { OccupancySensorService } from '../services/occupancySensorService';
import { LeakDetectorService } from '../services/leakDetector';
import { SmokeDetectorService } from '../services/smokeDetector';
import { CarbonMonoxideDetectorService } from '../services/carbonMonoxideDetector';
import { ValveService } from '../services/valveService';
import { ShortEvent } from '../webhook/subscriptionHandler';
import { FanSpeedService } from '../services/fanSpeedService';
import { WindowCoveriingService } from '../services/windowCoveringService';
import { ThermostatService } from '../services/thermostatService';


/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class GenericAccessory extends BaseAccessory {
  //  service: Service;
  capabilities;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */

  private services: BaseService[] = [];

  // Order of these matters.  Make sure secondary capabilities like 'battery' and 'contactSensor' are at the end.
  private static capabilityMap: {[key: string]: typeof BaseService} = {
    'doorControl': DoorService,
    'lock': LockService,
    // 'switch': SwitchService,
    'windowShadeLevel': WindowCoveriingService,
    'motionSensor': MotionService,
    'waterSensor': LeakDetectorService,
    'smokeDetector': SmokeDetectorService,
    'carbonMonoxideDetector': CarbonMonoxideDetectorService,
    'presenceSensor': OccupancySensorService,
    'temperatureMeasurement': TemperatureService,
    'relativeHumidityMeasurement': HumidityService,
    'illuminanceMeasurement': LightSensorService,
    'contactSensor': ContactSensorService,
    'battery': BatteryService,
    'valve': ValveService,
  };

  // Maps combinations of supported capabilities to a service
  private static comboCapabilityMap = [
    {
      capabilities: ['switch', 'fanSpeed', 'switchLevel'],
      service: FanSwitchLevelService,
    },
    {
      capabilities: ['switch', 'fanSpeed'],
      service: FanSpeedService,
    },
    {
      capabilities: ['switch', 'switchLevel'],
      service: LightService,
    },
    {
      capabilities: ['switch', 'colorControl'],
      service: LightService,
    },
    {
      capabilities: ['switch', 'colorTemperature'],
      service: LightService,
    },
    {
      capabilities: ['switch', 'valve'],
      service: ValveService,
    },
    {
      capabilities: ['switch'],
      service: SwitchService,
    },
    {
      capabilities: ['temperatureMeasurement',
        'thermostatMode',
        'thermostatHeatingSetpoint',
        'thermostatCoolingSetpoint'],
      service: ThermostatService,
    },
  ];

  constructor(
    platform: IKHomeBridgeHomebridgePlatform,
    accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
    const device = this.accessory.context.device;
    const component = device.components.find(c => c.id === 'main') || device.components[0];
    this.capabilities = component.capabilities;

    // Add services per capabilities

    // If this device has a 'switch' or 'thermostatMode' capability, need to look at the combinations to
    // determine what kind of device.  Fans, lights,
    // switches all have a switch capability and we need to add the correct one.

    Object.keys(GenericAccessory.capabilityMap).forEach((capability) => {
      if (this.capabilities.find((c) => c.id === capability)) {
        this.services.push(new (
          GenericAccessory.capabilityMap[capability])(this.platform, this.accessory, [capability], component.id, this, this.name,
          this.deviceStatus));
      }
    });
    if (this.capabilities.find(c => (c.id === 'switch') || c.id === 'thermostatMode')) {
      let service = this.findComboService(this.capabilities);
      if (service === undefined) {
        service = SwitchService;
      }
      this.services.push(new service(this.platform, this.accessory, this.capabilities.map(c => c.id), component.id, this, this.name,
        this.deviceStatus));
    }
  }

  // If this is a capability that needs to be combined with others in order to determone the service,
  // go through the combinations of cabailities in the map and return the first matching service.
  // We look at combinations because devices like lights that dim also have switch capabilities
  // as well as switchlevel capabilities.  Fans have switch and fanlevel capabilities.  This allows
  // us to find a services that best matches the combination of capabilities reported by the device.
  public findComboService(deviceCapabilities): typeof BaseService | undefined {
    let service: typeof BaseService | undefined = undefined;

    GenericAccessory.comboCapabilityMap.forEach(entry => {
      if (service === undefined) {
        let found = true;
        entry.capabilities.forEach(c => {
          if (!deviceCapabilities.find(dc => dc.id === c)) {
            found = false;
          }
        });
        if (found) {
          service = entry.service;
        }
      }
    });
    return service;
  }

  // Find return if a capability is supported by the multi-service accessory
  public static capabilitySupported(capability: string): boolean {
    if (Object.keys(GenericAccessory.capabilityMap).find(c => c === capability) || capability === 'switch') {
      return true;
    } else {
      return false;
    }
  }

  public processEvent(event: ShortEvent): void {
    this.log.debug(`Received events for ${this.name}`);

    const service = this.services.find(s => s.findServiceCapability(event.capability));

    if (service) {
      service.processEvent(event);
    }
  }
}
