import { BrokerUtil } from './brokerUtil';
import { v4 } from 'uuid';

export const configureService = async (serviceName: string, callback: Function, connectionString?: string, prefetch?: number) => {
  BrokerUtil.initBroker({
    host: connectionString || 'amqp://localhost',
    prefetch: prefetch || 100
  });
  const broker = BrokerUtil.getBroker();
  await broker.initialize();
  const queueName = serviceName;
  const callBackQueue = `${queueName}-${v4()}`;
  broker.declareQueue(callBackQueue, { autoDelete: true });
  broker.callbackQueue = callBackQueue;
  broker.subscribe(callBackQueue, callback, undefined, false);
  broker.subscribe(queueName, callback, undefined, true);
  setTimeout(() => {
    const isConnected = broker.isConnected();
    console.log(isConnected ? 'Broker succesfully connected' : 'Broker connection failed. Check configuration');
  }, 5000);
}

export const sendRequest = async <T>(code: number, body: any, queueName: string) => {
  try {
    const broker = BrokerUtil.getBroker();
    const result = await broker.sendRequest<T>(code, body, queueName);
    return result;
  } catch (error) {
    return error;
  }
}