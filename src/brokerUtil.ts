import { IBroker } from './interfaces/broker';
import { Broker } from './broker';
import { IBrokerConfig } from './interfaces/brokerConfig';

export class BrokerUtil {

  private static broker: IBroker;

  public static initBroker(configuration: IBrokerConfig): void {
    this.broker = new Broker(configuration);
  }

  public static getBroker(): IBroker {
    if (!this.broker) {
      throw new Error('Broker not initialized. Use "configureService" method first!');
    }
    return this.broker;
  }
}
